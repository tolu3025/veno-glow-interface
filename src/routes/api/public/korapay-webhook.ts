import { createFileRoute } from "@tanstack/react-router";
import {
  amountToKobo,
  korapayWebhookSchema,
  korapayTransactionSchema,
  verifyKorapaySignature,
} from "@/lib/korapay-deposit";

export const Route = createFileRoute("/api/public/korapay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.KORAPAY_SECRET_KEY;
        if (!secret) return new Response("Unavailable", { status: 503 });

        // Reject oversized payloads before reading.
        if (Number(request.headers.get("content-length") || 0) > 65536)
          return new Response("Too large", { status: 413 });

        const raw = await request.text();
        if (raw.length > 65536) return new Response("Too large", { status: 413 });

        // Verify HMAC-SHA256 signature; header name: x-korapay-signature
        if (
          !(await verifyKorapaySignature(
            raw,
            request.headers.get("x-korapay-signature"),
            secret,
          ))
        )
          return new Response("Invalid signature", { status: 401 });

        let envelope: unknown;
        try {
          envelope = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const payload = korapayWebhookSchema.safeParse(envelope);
        if (!payload.success)
          return new Response("Bad payload", { status: 400 });

        const ev = payload.data;

        // Handle payout webhook callbacks (transfer.success / transfer.failed)
        if (
          ev.event === "transfer.success" ||
          ev.event === "transfer.failed"
        ) {
          const reference = ev.data.reference;
          if (!reference || reference.length > 100)
            return new Response("Bad reference", { status: 400 });
          const { reconcileKorapayWithdrawal } = await import(
            "@/lib/korapay-payout.server"
          );
          const status = await reconcileKorapayWithdrawal(reference);
          return status && status !== "processing"
            ? new Response("OK")
            : new Response("Awaiting verification", { status: 503 });
        }

        // Handle inbound deposit — Korapay fires "charge.success" for bank-transfer virtual accounts
        if (ev.event !== "charge.success")
          return new Response("Ignored", { status: 200 });

        if (ev.data.status !== "success")
          return new Response("Ignored", { status: 200 });

        if (ev.data.currency && ev.data.currency !== "NGN")
          return new Response("Ignored", { status: 200 });

        // Requery Korapay; a valid signature alone is not proof of settled funds.
        const { korapayRequest } = await import("@/lib/korapay.server");
        const check = await korapayRequest<unknown>(
          `/merchant/api/v1/charges/${encodeURIComponent(ev.data.reference)}`,
        );
        const tx =
          check.kind === "success"
            ? korapayTransactionSchema.safeParse(check.data)
            : null;

        if (
          !tx?.success ||
          tx.data.reference !== ev.data.reference ||
          tx.data.status !== "success" ||
          (tx.data.currency && tx.data.currency !== "NGN")
        ) {
          console.error("[korapay-webhook] verification failed", {
            reference: ev.data.reference,
            kind: check.kind,
          });
          return new Response("Awaiting verification", { status: 503 });
        }

        // Amount cross-check: webhook amount must match requeried amount.
        let webhookKobo: number;
        let txKobo: number;
        try {
          webhookKobo = amountToKobo(ev.data.amount);
          txKobo = amountToKobo(tx.data.amount);
        } catch {
          return new Response("Invalid amount", { status: 400 });
        }
        if (webhookKobo !== txKobo) {
          console.error("[korapay-webhook] amount mismatch", {
            reference: ev.data.reference,
          });
          return new Response("Awaiting verification", { status: 503 });
        }

        // The account_reference is stored in metadata by Korapay; fall back to customer email lookup.
        const accountReference =
          (tx.data.metadata?.["account_reference"] as string | undefined) ??
          (ev.data.metadata?.["account_reference"] as string | undefined);

        if (!accountReference || accountReference.length > 200) {
          console.error("[korapay-webhook] missing account_reference", {
            reference: ev.data.reference,
          });
          return new Response("Missing mapping", { status: 400 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { error } = await supabaseAdmin.rpc("credit_korapay_deposit", {
          _account_reference: accountReference,
          _transaction_reference: ev.data.reference,
          _amount_kobo: txKobo,
        });
        if (error) {
          console.error("[korapay-webhook] credit failed", {
            reference: ev.data.reference,
            error: error.message,
          });
          return new Response("Not posted", { status: 500 });
        }
        return new Response("OK", { status: 200 });
      },
    },
  },
});
