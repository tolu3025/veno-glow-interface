import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { payoutInputSchema } from "./monnify-payout";

const accountInput = z.object({ bankCode: z.string().regex(/^\d{2,12}$/), accountNumber: z.string().regex(/^\d{10}$/) });

export const getMonnifyBanks = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async () => {
  const { monnifyRequest } = await import("./monnify.server");
  const result = await monnifyRequest<unknown>("/api/v1/banks");
  const parsed = result.kind === "success" ? z.array(z.object({ name: z.string(), code: z.string(), nipBankCode: z.string().nullish() })).safeParse(result.data) : null;
  if (!parsed?.success) throw new Error("Couldn't load banks. Please try again.");
  return { banks: parsed.data };
});

export const resolveMonnifyAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => accountInput.parse(input)).handler(async ({ data }) => {
    const { monnifyRequest } = await import("./monnify.server");
    const result = await monnifyRequest<unknown>(`/api/v2/disbursements/account/validate?accountNumber=${data.accountNumber}&bankCode=${data.bankCode}`);
    const parsed = result.kind === "success" ? z.object({ accountName: z.string().min(2), accountNumber: z.string(), bankCode: z.string() }).safeParse(result.data) : null;
    if (!parsed?.success || parsed.data.accountNumber !== data.accountNumber)
      throw new Error("We couldn't verify that bank account. Check the details and try again.");
    return { account_name: parsed.data.accountName, bank_code: parsed.data.bankCode };
  });

export const submitMonnifyWithdrawal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => payoutInputSchema.parse(input)).handler(async ({ data, context }) => {
    // Fail closed before touching balances: live payout approval/funding is an operator action.
    const source = process.env["MONNIFY_SOURCE_ACCOUNT_NUMBER"];
    if (process.env["MONNIFY_PAYOUTS_ENABLED"] !== "true" || !source || !/^\d{10}$/.test(source))
      throw new Error("Withdrawals are paused while we complete our bank upgrade. Your balance is safe.");
    const { verifyPinWithEdge } = await import("./rides.server");
    const pin = await verifyPinWithEdge(data.pin);
    if (!pin.ok) throw new Error(pin.error ?? "Incorrect PIN");
    const { monnifyRequest } = await import("./monnify.server");
    // Never trust the account name or bank name supplied by a browser.
    const [banks, enquiry] = await Promise.all([
      monnifyRequest<unknown>("/api/v1/banks"),
      monnifyRequest<unknown>(`/api/v2/disbursements/account/validate?accountNumber=${data.accountNumber}&bankCode=${data.bankCode}`),
    ]);
    const bankList = banks.kind === "success" ? z.array(z.object({ name: z.string(), code: z.string(), nipBankCode: z.string().nullish() })).safeParse(banks.data) : null;
    const account = enquiry.kind === "success" ? z.object({ accountName: z.string().min(2), accountNumber: z.string(), bankCode: z.string() }).safeParse(enquiry.data) : null;
    const bank = bankList?.success ? bankList.data.find(b => b.code === data.bankCode) ?? bankList.data.find(b => b.nipBankCode === data.bankCode) : null;
    if (!bank || !account?.success || account.data.accountNumber !== data.accountNumber || account.data.bankCode !== bank.code)
      throw new Error("We couldn't verify the receiving account. Please try again.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Monnify rejects references longer than 64 characters.
    const reference = `KM-${data.idempotencyKey}`;
    const { data: started, error } = await supabaseAdmin.rpc("begin_monnify_withdrawal", {
      _user_id: context.userId, _reference: reference, _idempotency_key: `MNFY-${data.idempotencyKey}`,
      _bank_name: bank.name, _bank_code: bank.code, _account_number: data.accountNumber,
      _account_name: account.data.accountName, _amount_kobo: Math.round(data.amount * 100),
    });
    const parsed = z.object({ success: z.boolean(), error: z.string().optional(), withdrawal_status: z.string().optional(), fee_kobo: z.number().optional(), total_debit_kobo: z.number().optional() }).safeParse(started);
    if (error || !parsed.success) throw new Error("We couldn't start this withdrawal. Please try again.");
    if (!parsed.data.success) {
      const errors: Record<string, string> = { insufficient_balance: "Your balance is too low for the amount and fee.", daily_limit: "This withdrawal exceeds your daily limit.", kyc_required: "Complete your NIN verification before withdrawing.", account_unavailable: "Your account cannot withdraw right now.", idempotency_conflict: "This withdrawal request has already been used. Check your history." };
      throw new Error(errors[parsed.data.error ?? ""] ?? "We couldn't start this withdrawal. Please contact support.");
    }
    // Atomic conditional claim allows exactly one money-moving POST, including concurrent retries.
    const { data: claimed, error: claimError } = await supabaseAdmin.from("withdrawals")
      .update({ provider_attempted_at: new Date().toISOString() }).eq("reference", reference).eq("provider", "monnify")
      .eq("status", "processing").is("provider_attempted_at", null).select("id").maybeSingle();
    let status = parsed.data.withdrawal_status ?? "processing";
    try {
      if (!claimError && claimed) {
        const sent = await monnifyRequest<unknown>("/api/v2/disbursements/single", { method: "POST", body: {
          amount: data.amount, reference, narration: "KukaPay withdrawal", destinationBankCode: bank.code,
          destinationAccountNumber: data.accountNumber, destinationAccountName: account.data.accountName,
          currency: "NGN", sourceAccountNumber: source,
        } });
        if (sent.kind === "rejected") {
          // Monnify definitively refused the request, so no money left: refund amount + fee exactly once.
          console.error("[monnify-payout] transfer rejected", { reference, httpStatus: sent.httpStatus, message: sent.message });
          const { error: refundError } = await supabaseAdmin.rpc("finish_monnify_withdrawal", {
            _reference: reference, _outcome: "refunded", _provider_reference: "", _provider_status: "REJECTED",
            _failure_reason: sent.message ?? "The bank transfer was declined.",
          });
          if (!refundError) throw Object.assign(new Error(`Withdrawal declined: ${sent.message ?? "please try again"}. Your money has been returned.`), { declined: true });
        }
      }
      const { reconcileMonnifyWithdrawal } = await import("./monnify-payout.server");
      status = await reconcileMonnifyWithdrawal(reference) ?? status;
    } catch (err) {
      if ((err as { declined?: boolean })?.declined) throw err;
      console.error("[monnify-payout] awaiting reconciliation", { reference });
    }
    // Once debited, always return the reference/receipt, even if Monnify is unavailable.
    return { reference, status, net_payout: data.amount, fee: (parsed.data.fee_kobo ?? 0) / 100, total_debit: (parsed.data.total_debit_kobo ?? 0) / 100 };
  });

export const checkMonnifyWithdrawal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ reference: z.string().min(12).max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: owned, error } = await context.supabase.from("withdrawals").select("status,provider")
      .eq("reference", data.reference).eq("user_id", context.userId).maybeSingle();
    if (error || !owned) throw new Error("Withdrawal not found.");
    if (owned.provider !== "monnify" || !["pending", "processing"].includes(owned.status)) return { status: owned.status };
    const { reconcileMonnifyWithdrawal } = await import("./monnify-payout.server");
    return { status: await reconcileMonnifyWithdrawal(data.reference) ?? owned.status };
  });