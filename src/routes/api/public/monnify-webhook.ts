import { createFileRoute } from "@tanstack/react-router";
import { amountToKobo, monnifyWebhookSchema, verifiedTransactionSchema, verifyMonnifySignature } from "@/lib/monnify-deposit";

export const Route = createFileRoute("/api/public/monnify-webhook")({
  server: { handlers: { POST: async ({ request }) => {
    const secret = process.env.MONNIFY_SECRET_KEY;
    if (!secret) return new Response("Unavailable", { status: 503 });
    if (Number(request.headers.get("content-length") || 0) > 65536) return new Response("Too large", { status: 413 });
    const raw = await request.text();
    if (raw.length > 65536) return new Response("Too large", { status: 413 });
    if (!await verifyMonnifySignature(raw, request.headers.get("monnify-signature"), secret)) return new Response("Invalid signature", { status: 401 });
    let envelope: unknown;
    try { envelope = JSON.parse(raw); } catch { return new Response("Bad payload", { status: 400 }); }
    if (envelope && typeof envelope === "object" && "eventType" in envelope
      && ["SUCCESSFUL_DISBURSEMENT", "FAILED_DISBURSEMENT", "REVERSED_DISBURSEMENT"].includes(String(envelope.eventType))) {
      const event = "eventData" in envelope ? envelope.eventData : null;
      const reference = event && typeof event === "object" && "reference" in event ? event.reference : null;
      if (typeof reference !== "string" || reference.length > 100) return new Response("Bad reference", { status: 400 });
      const { reconcileMonnifyWithdrawal } = await import("@/lib/monnify-payout.server");
      const status = await reconcileMonnifyWithdrawal(reference);
      return status && status !== "processing" ? new Response("OK") : new Response("Awaiting verification", { status: 503 });
    }
    let payload;
    try { payload = monnifyWebhookSchema.parse(envelope); } catch { return new Response("Bad payload", { status: 400 }); }
    const ev = payload.eventData;
    // Acknowledge events we do not credit so Monnify stops retrying them.
    if (payload.eventType !== "SUCCESSFUL_TRANSACTION" || ev.product.type !== "RESERVED_ACCOUNT" || ev.paymentStatus !== "PAID") return new Response("Ignored", { status: 200 });
    const { monnifyRequest } = await import("@/lib/monnify.server");
    // Requery Monnify; a valid signature alone is not proof of settled funds.
    const check = await monnifyRequest<unknown>(`/api/v2/transactions/${encodeURIComponent(ev.transactionReference)}`);
    const tx = check.kind === "success" ? verifiedTransactionSchema.safeParse(check.data) : null;
    if (!tx?.success || tx.data.transactionReference !== ev.transactionReference || tx.data.paymentStatus !== "PAID"
      || (tx.data.product && (tx.data.product.type !== "RESERVED_ACCOUNT" || tx.data.product.reference !== ev.product.reference))
      || (tx.data.currencyCode && tx.data.currencyCode !== "NGN")
      || amountToKobo(tx.data.amountPaid) !== amountToKobo(ev.amountPaid)) {
      console.error("[monnify-webhook] verification failed", { reference: ev.transactionReference, kind: check.kind });
      return new Response("Awaiting verification", { status: 503 });
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("credit_monnify_deposit", {
      _account_reference: ev.product.reference, _transaction_reference: ev.transactionReference, _amount_kobo: amountToKobo(tx.data.amountPaid),
    });
    if (error) { console.error("[monnify-webhook] credit failed", { reference: ev.transactionReference, error: error.message }); return new Response("Not posted", { status: 500 }); }
    return new Response("OK", { status: 200 });
  } } },
});
