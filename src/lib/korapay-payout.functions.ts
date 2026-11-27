import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const payoutInputSchema = z.object({
  bankCode: z.string().regex(/^\d{2,12}$/),
  accountNumber: z.string().regex(/^\d{10}$/),
  amount: z
    .number()
    .finite()
    .min(1000)
    .max(1000000)
    .refine(
      (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.00001,
      "Use at most two decimal places.",
    ),
  pin: z.string().regex(/^\d{4}$/),
  idempotencyKey: z.string().uuid(),
});

/** GET /merchant/api/v1/misc/banks?countryCode=NG */
export const getKorapayBanks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { korapayRequest } = await import("./korapay.server");
    const result = await korapayRequest<unknown>(
      "/merchant/api/v1/misc/banks?countryCode=NG",
    );
    if (result.kind !== "success") {
      throw new Error("Could not load bank list. Please try again.");
    }
    const banks = result.data as Array<{
      name: string;
      slug: string;
      code: string;
      nibss_bank_code?: string;
    }>;
    return {
      banks: banks.map((b) => ({
        name: b.name,
        code: b.code,
        nipBankCode: b.nibss_bank_code ?? null,
      })),
    };
  });

/** POST /merchant/api/v1/misc/banks/resolve */
export const resolveKorapayAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        bankCode: z.string().regex(/^\d{2,12}$/),
        accountNumber: z.string().regex(/^\d{10}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { korapayRequest } = await import("./korapay.server");
    const result = await korapayRequest<unknown>(
      "/merchant/api/v1/misc/banks/resolve",
      {
        method: "POST",
        body: { bank_code: data.bankCode, account_number: data.accountNumber },
      },
    );
    if (result.kind !== "success")
      throw new Error("Could not verify that account. Please try again.");
    const resolved = result.data as {
      account_name?: string;
      account_number?: string;
      bank_code?: string;
    };
    if (!resolved.account_name || !resolved.account_number)
      throw new Error("Invalid account details returned.");
    return {
      success: true,
      accountName: resolved.account_name,
      accountNumber: resolved.account_number,
      bankCode: resolved.bank_code ?? data.bankCode,
    };
  });

/** POST /merchant/api/v1/transactions/disburse — atomic debit + single payout attempt. */
export const submitKorapayWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => payoutInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Verify PIN server-side.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("transaction_pin_hash,kyc_level,is_suspended")
      .eq("id", context.userId)
      .single();
    if (profileError || !profile || profile.is_suspended)
      throw new Error("Your account is not available for withdrawals right now.");
    if (profile.kyc_level < 1)
      throw new Error("Complete your identity verification before withdrawing.");
    if (!profile.transaction_pin_hash)
      throw new Error("Set a transaction PIN in your profile first.");

    const { verifyPin } = await import("@/lib/auth-2fa");
    if (!(await verifyPin(data.pin, profile.transaction_pin_hash)))
      throw new Error("Incorrect PIN. Please try again.");

    const { korapayRequest } = await import("./korapay.server");

    // Fetch and validate bank list to confirm bank code.
    const bankList = await korapayRequest<unknown>(
      "/merchant/api/v1/misc/banks?countryCode=NG",
    );
    const banks = bankList.kind === "success"
      ? (bankList.data as Array<{ name: string; code: string; nibss_bank_code?: string }>)
      : null;
    const bank = banks?.find((b) => b.code === data.bankCode);
    if (!bank) throw new Error("Selected bank is not currently supported.");

    // Re-resolve the account name for confirmation.
    const account = await korapayRequest<{
      account_name?: string;
      account_number?: string;
      bank_code?: string;
    }>("/merchant/api/v1/misc/banks/resolve", {
      method: "POST",
      body: { bank_code: data.bankCode, account_number: data.accountNumber },
    });
    if (
      account.kind !== "success" ||
      account.data.account_number !== data.accountNumber
    )
      throw new Error(
        "We couldn't verify the receiving account. Please try again.",
      );

    const reference = `KP-${data.idempotencyKey}`;
    const { data: started, error } = await supabaseAdmin.rpc(
      "begin_korapay_withdrawal",
      {
        _user_id: context.userId,
        _reference: reference,
        _idempotency_key: `KORA-${data.idempotencyKey}`,
        _bank_name: bank.name,
        _bank_code: bank.code,
        _account_number: data.accountNumber,
        _account_name: account.data.account_name ?? "",
        _amount_kobo: Math.round(data.amount * 100),
      },
    );

    const parsed = z
      .object({
        success: z.boolean(),
        error: z.string().optional(),
        withdrawal_status: z.string().optional(),
        fee_kobo: z.number().optional(),
        total_debit_kobo: z.number().optional(),
      })
      .safeParse(started);
    if (error || !parsed.success)
      throw new Error("We couldn't start this withdrawal. Please try again.");
    if (!parsed.data.success) {
      const errors: Record<string, string> = {
        insufficient_balance: "Your balance is too low for the amount and fee.",
        daily_limit: "This withdrawal exceeds your daily limit.",
        kyc_required:
          "Complete your identity verification before withdrawing.",
        account_unavailable:
          "Your account cannot withdraw right now.",
        idempotency_conflict:
          "This withdrawal request has already been used. Check your history.",
      };
      throw new Error(
        errors[parsed.data.error ?? ""] ??
          "We couldn't start this withdrawal. Please contact support.",
      );
    }

    // Conditional single-attempt claim — prevents duplicate Korapay calls on retries.
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("withdrawals")
      .update({ provider_attempted_at: new Date().toISOString() })
      .eq("reference", reference)
      .eq("provider", "korapay")
      .eq("status", "pending")
      .is("provider_attempted_at", null)
      .select("id")
      .maybeSingle();

    let status = parsed.data.withdrawal_status ?? "pending";
    try {
      if (!claimError && claimed) {
        const sent = await korapayRequest<unknown>(
          "/merchant/api/v1/transactions/disburse",
          {
            method: "POST",
            body: {
              reference,
              bank_code: bank.code,
              account_number: data.accountNumber,
              account_name: account.data.account_name,
              amount: data.amount,
              currency: "NGN",
              narration: "KukaPay withdrawal",
            },
          },
        );
        if (sent.kind === "rejected") {
          console.error("[korapay-payout] transfer rejected", {
            reference,
            httpStatus: sent.httpStatus,
            message: sent.message,
          });
          const { error: refundError } = await supabaseAdmin.rpc(
            "finish_korapay_withdrawal",
            {
              _reference: reference,
              _outcome: "refunded",
              _provider_reference: "",
              _provider_status: "rejected",
              _failure_reason:
                sent.message ?? "The bank transfer was declined.",
            },
          );
          if (!refundError)
            throw Object.assign(
              new Error(
                `Withdrawal declined: ${sent.message ?? "please try again"}. Your money has been returned.`,
              ),
              { declined: true },
            );
        }
      }
      const { reconcileKorapayWithdrawal } = await import(
        "./korapay-payout.server"
      );
      status = (await reconcileKorapayWithdrawal(reference)) ?? status;
    } catch (err) {
      if ((err as { declined?: boolean })?.declined) throw err;
      console.error("[korapay-payout] awaiting reconciliation", { reference });
    }

    return {
      reference,
      status,
      net_payout: data.amount,
      fee: (parsed.data.fee_kobo ?? 0) / 100,
      total_debit: (parsed.data.total_debit_kobo ?? 0) / 100,
    };
  });

/** Poll withdrawal status (safe, non-money-moving). */
export const checkKorapayWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ reference: z.string().min(12).max(100) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: owned, error } = await context.supabase
      .from("withdrawals")
      .select("status,provider")
      .eq("reference", data.reference)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error || !owned) throw new Error("Withdrawal not found.");
    if (
      owned.provider !== "korapay" ||
      !["pending", "processing"].includes(owned.status)
    )
      return { status: owned.status };
    const { reconcileKorapayWithdrawal } = await import(
      "./korapay-payout.server"
    );
    return {
      status: (await reconcileKorapayWithdrawal(data.reference)) ?? owned.status,
    };
  });
