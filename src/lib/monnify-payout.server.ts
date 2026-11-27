import { payoutOutcome } from "./monnify-payout";
import { monnifyRequest } from "./monnify.server";

/** Only provider-requeried, fully matched transfers may complete or refund a wallet. */
export async function reconcileMonnifyWithdrawal(reference: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row, error } = await supabaseAdmin.from("withdrawals").select("reference,status,amount_kobo,bank_code,account_number")
    .eq("reference", reference).eq("provider", "monnify").maybeSingle();
  if (error || !row) return null;
  if (["completed", "refunded", "failed", "reversed"].includes(row.status)) return row.status;
  if (!row.reference || !row.amount_kobo || !row.bank_code) return null;
  const check = await monnifyRequest<unknown>(`/api/v2/disbursements/single/summary?reference=${encodeURIComponent(reference)}`);
  if (check.kind !== "success") return null;
  const match = payoutOutcome(check.data, { reference, amountKobo: row.amount_kobo, bankCode: row.bank_code, accountNumber: row.account_number });
  if (!match) return null;
  if (match.outcome === "processing") return "processing";
  const { error: finishError } = await supabaseAdmin.rpc("finish_monnify_withdrawal", {
    _reference: reference, _outcome: match.outcome, _provider_reference: match.providerReference ?? "",
    _provider_status: match.status, _failure_reason: match.outcome === "refunded" ? "Monnify confirmed the transfer failed or was reversed." : "",
  });
  if (finishError) { console.error("[monnify-payout] reconciliation failed", { reference, error: finishError.message }); return null; }
  return match.outcome;
}