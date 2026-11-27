import { korapayPayoutOutcome } from "./korapay-deposit";
import { korapayRequest } from "./korapay.server";

/** Only provider-requeried, fully matched transfers may complete or refund a wallet. */
export async function reconcileKorapayWithdrawal(reference: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row, error } = await supabaseAdmin
    .from("withdrawals")
    .select("reference,status,amount_kobo,bank_code,account_number")
    .eq("reference", reference)
    .eq("provider", "korapay")
    .maybeSingle();
  if (error || !row) return null;
  if (["completed", "refunded", "failed", "reversed"].includes(row.status))
    return row.status;
  if (!row.reference || !row.amount_kobo || !row.bank_code) return null;

  // Requery Korapay for the payout status.
  const check = await korapayRequest<unknown>(
    `/merchant/api/v1/transactions/disburse/${encodeURIComponent(reference)}`,
  );
  if (check.kind !== "success") return null;

  const match = korapayPayoutOutcome(check.data, {
    reference,
    amountKobo: row.amount_kobo,
    bankCode: row.bank_code,
    accountNumber: row.account_number,
  });
  if (!match) return null;
  if (match.outcome === "processing") return "processing";

  const { error: finishError } = await supabaseAdmin.rpc(
    "finish_korapay_withdrawal",
    {
      _reference: reference,
      _outcome: match.outcome,
      _provider_reference: match.providerReference ?? "",
      _provider_status: match.status,
      _failure_reason:
        match.outcome === "refunded"
          ? "Korapay confirmed the transfer failed."
          : "",
    },
  );
  if (finishError) {
    console.error("[korapay-payout] reconciliation failed", {
      reference,
      error: finishError.message,
    });
    return null;
  }
  return match.outcome;
}
