import { createFileRoute } from "@tanstack/react-router";
import { squadDepositSchema, signatureInput, nairaToKobo, matchesVerifiedDeposit } from "@/lib/squad-deposit";
import { verifySquadWebhookSignature } from "@/lib/squad-signature";

export const Route = createFileRoute("/api/public/squad-webhook")({
  server: { handlers: { POST: async ({ request }) => {
    const reply = (status: number, reference = "", description = "Validation failure") => Response.json({
      response_code: status, transaction_reference: reference, response_description: description,
    }, { status });
    const secret = process.env.SQUAD_SECRET_KEY;
    if (!secret) return reply(503, "", "Temporarily unavailable");
    if (Number(request.headers.get("content-length") || 0) > 65536) return reply(413);
    // Bound streaming reads even if Content-Length is absent or forged.
    const reader = request.body?.getReader();
    if (!reader) return reply(400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 65536) { await reader.cancel(); return reply(413); }
        chunks.push(chunk.value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const raw = new TextDecoder().decode(bytes);
      const parsed = squadDepositSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return reply(400);
      const payload = parsed.data;
      const sig = request.headers.get("x-squad-signature") || request.headers.get("x-squad-encrypted-body");
      if (!await verifySquadWebhookSignature(signatureInput(raw, payload), sig, secret)) return reply(401);
      if (payload.meta?.freeze_transaction_ref || payload.meta?.reason_for_frozen_transaction) return reply(409, payload.transaction_reference, "Deposit under review");
      const { squadRequest } = await import("@/lib/squad-http.server");
      // Requery with the merchant key; signature alone is insufficient (V2/V3 omit freeze/status fields).
      const verified = await squadRequest<unknown>(process.env.SQUAD_BASE_URL || "https://api-d.squadco.com",
        `/virtual-account/customer/transactions/${encodeURIComponent(payload.customer_identifier)}`, secret);
      if (verified.kind !== "success" || !Array.isArray(verified.data) || !verified.data.some((row) => matchesVerifiedDeposit(payload, row)))
        return reply(503, payload.transaction_reference, "Awaiting deposit verification");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.rpc("credit_squad_deposit", {
        _customer_identifier: payload.customer_identifier, _account_number: payload.virtual_account_number,
        _transaction_reference: payload.transaction_reference, _amount_kobo: nairaToKobo(payload.principal_amount),
      });
      if (error) return reply(500, payload.transaction_reference, "Deposit could not be posted");
      return reply(200, payload.transaction_reference, "Success");
    } catch {
      return reply(400);
    }
  } } },
});