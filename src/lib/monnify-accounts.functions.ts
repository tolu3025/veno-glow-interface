import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { monnifyActivationSchema, reservedAccountSchema } from "./monnify-deposit";

/** Verifies the caller's NIN with Monnify, then issues their reserved account. */
export const activateMonnifyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => monnifyActivationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const fail = (error: string, rejected = false) => ({ success: false, error, rejected });
    const { data: profile, error: profileError } = await context.supabase.from("profiles")
      .select("full_name,kyc_level,is_suspended").eq("id", context.userId).single();
    if (profileError || !profile || profile.is_suspended)
      return fail("Your account cannot be activated right now. Please contact support.");
    const needsLevel1 = profile.kyc_level < 1;
    const fullName = profile.full_name.trim().replace(/\s+/g, " ");
    const email = context.claims.email;
    if (fullName.split(" ").length < 2 || typeof email !== "string")
      return fail("Update your full name in your profile first.");

    const { monnifyRequest, monnifyConfig } = await import("./monnify.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let cfg;
    try { cfg = monnifyConfig(); } catch { return fail("Account creation is temporarily unavailable."); }
    const reference = `KUKA-${context.userId}`;
    const { data: claim, error: claimError } = await supabaseAdmin.rpc("claim_monnify_account", { _user_id: context.userId, _account_reference: reference });
    const action = (claim as { action?: string } | null)?.action;
    if (claimError || !action) return fail("Please try again shortly.");
    if (action === "ready") return { success: true, error: null, rejected: false };
    if (action === "wait") return fail("Your account request is being checked. Please try again in 30 seconds.");

    // Recover an existing account; otherwise Monnify verifies the NIN while creating it.
    let result = await monnifyRequest<unknown>(`/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(reference)}`);
    if (result.kind === "rejected") {
      result = await monnifyRequest<unknown>("/api/v2/bank-transfer/reserved-accounts", { method: "POST", body: {
        accountReference: reference, accountName: fullName, currencyCode: "NGN", contractCode: cfg.contractCode,
        customerEmail: email, customerName: fullName, nin: data.nin, getAllAvailableBanks: true,
      } });
    }
    if (result.kind !== "success") {
      console.error("[monnify-activate] account creation failed", { kind: result.kind, httpStatus: result.httpStatus, message: result.message });
      const rejected = result.kind === "rejected";
      await supabaseAdmin.from("monnify_virtual_accounts").update({ status: rejected ? "rejected" : "pending" }).eq("user_id", context.userId);
      if (rejected && needsLevel1) {
        await supabaseAdmin.from("kyc_documents").insert({ user_id: context.userId, kyc_level: 1, verification_status: "rejected",
          admin_notes: `Monnify could not create an account with the submitted NIN${result.message ? `: ${result.message}` : ""}.` });
      }
      return fail(rejected
        ? "We could not create your account with those details. Check your NIN and profile name, then try again."
        : "Our bank partner is not responding. Please try again shortly; do not send money until your account appears.", rejected);
    }
    const parsed = reservedAccountSchema.safeParse(result.data);
    if (!parsed.success || parsed.data.accountReference !== reference) return fail("Your account details are still being checked. Please try again shortly.");
    const primary = parsed.data.accounts[0];
    const { error: saveError } = await supabaseAdmin.from("monnify_virtual_accounts").update({
      status: "ready", account_number: primary.accountNumber, bank_name: primary.bankName,
      account_name: primary.accountName || parsed.data.accountName || fullName, accounts: parsed.data.accounts as unknown as import("@/integrations/supabase/types").Json, updated_at: new Date().toISOString(),
    }).eq("user_id", context.userId);
    if (saveError) return fail("Your account was issued but could not be saved. Please check again shortly.");
    if (needsLevel1) {
      await supabaseAdmin.from("profiles").update({ kyc_level: 1, kyc_status: "verified" }).eq("id", context.userId);
      await supabaseAdmin.from("kyc_documents").insert({ user_id: context.userId, kyc_level: 1, verification_status: "approved",
        admin_notes: "NIN verified instantly via Monnify; reserved account issued." });
    }
    return { success: true, error: null, rejected: false };
  });
