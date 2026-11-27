import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { squadActivationSchema } from "./squad-deposit";

export const activateSquadAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => squadActivationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const fail = (error: string, rejected = false) => ({ success: false, error, rejected });
    const { data: profile, error: profileError } = await context.supabase.from("profiles")
      .select("full_name,phone_number,kyc_level,kyc_status,is_suspended").eq("id", context.userId).single();
    if (profileError || !profile || profile.is_suspended)
      return fail("Your account cannot be activated right now. Please contact support.");
    // Squad's BVN match IS Level 1 KYC: Level 0 users activate here and are
    // approved instantly on a successful match; already-verified users (the
    // Flutterwave migration) just get their new account number.
    const needsLevel1 = profile.kyc_level < 1;
    const names = profile.full_name.trim().split(/\s+/);
    const phone = profile.phone_number.replace(/\D/g, "").replace(/^234/, "0");
    const email = context.claims.email;
    if (names.length < 2 || !/^0\d{10}$/.test(phone) || typeof email !== "string")
      return fail("Update your full name and Nigerian phone number in your profile first.");
    const { accountResponseSchema, retrieveSquadAccount, squadConfig } = await import("./squad-accounts.server");
    const { squadRequest } = await import("./squad-http.server");
    const config = squadConfig();
    // Privileged provisioning is scoped exclusively to the validated caller, never a submitted user ID.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const identifier = `KUKA${context.userId.replace(/-/g, "")}`;
    const { data: claim, error: claimError } = await supabaseAdmin.rpc("claim_squad_account", { _user_id: context.userId, _customer_identifier: identifier });
    if (claimError || !claim || typeof claim !== "object" || Array.isArray(claim)) return fail("Please try again shortly.");
    if (claim.action === "ready") return { success: true, error: null };
    if (claim.action === "wait") return fail("Your account request is being checked. Please try again in one minute.");
    let result = await retrieveSquadAccount(identifier);
    // Only a definitive 404 permits a new create; unknown results must be recovered, not blindly retried.
    // A definitive 404 means Squad holds no account for this identifier, so creating is safe
    // for both first attempts and recoveries of earlier failed attempts.
    if (result.kind === "rejected" && result.httpStatus === 404) {
      const middleName = names.slice(1, -1).join(" ");
      result = await squadRequest<unknown>(config.base, "/virtual-account", config.secret, { method: "POST", body: {
        customer_identifier: identifier, first_name: names[0], last_name: names[names.length - 1],
        // Squad rejects an empty middle_name, so only send it when the student has one.
        ...(middleName ? { middle_name: middleName } : {}), mobile_num: phone, email,
        bvn: data.bvn, dob: `${data.dob.slice(5, 7)}/${data.dob.slice(8, 10)}/${data.dob.slice(0, 4)}`,
        gender: data.gender, address: data.address,
        // No beneficiary_account: retain funds in Squad's wallet, with auto-settlement disabled by the merchant.
      } });
    }
    if (result.kind !== "success") {
      console.error("[squad-activate] account creation failed", { kind: result.kind, httpStatus: result.httpStatus, message: result.message });
      const rejected = result.kind === "rejected" && [400, 422, 424].includes(result.httpStatus);
      await supabaseAdmin.from("squad_virtual_accounts").update({ status: rejected ? "rejected" : "pending" }).eq("user_id", context.userId);
      if (rejected && needsLevel1) {
        // Record the failed match so the KYC page shows the rejection state
        // and admins can see it. The BVN itself is never stored.
        await supabaseAdmin.from("kyc_documents").insert({
          user_id: context.userId, kyc_level: 1, verification_status: "rejected",
          admin_notes: "Bank could not match the BVN, date of birth, name or phone number submitted.",
        });
      }
      const reason = rejected && result.message && /bvn|date|dob|phone|mobile|name|gender|address/i.test(result.message) ? ` (${result.message.replace(/"/g, "")})` : "";
      return fail(rejected ? `We could not match your details${reason}. Check your BVN, date of birth, gender, name and phone number, then try again.` : "Your bank has not confirmed your account yet. Please check again shortly; do not send money until your new account appears.", rejected);
    }
    const account = accountResponseSchema.safeParse(result.data);
    if (!account.success || account.data.customer_identifier !== identifier || !["058", "737"].includes(account.data.bank_code)) {
      await supabaseAdmin.from("squad_virtual_accounts").update({ status: "pending" }).eq("user_id", context.userId);
      return fail("Your new account details are still being checked. Please try again shortly.");
    }
    const { error: saveError } = await supabaseAdmin.from("squad_virtual_accounts").update({
      status: "ready", account_number: account.data.virtual_account_number, bank_name: "GTBank",
      account_name: account.data.account_name || `${account.data.first_name} ${account.data.last_name}`,
    }).eq("user_id", context.userId);
    if (saveError) return fail("Your account was issued but could not be saved. Please check again shortly.");
    if (needsLevel1) {
      // Successful BVN match approves Level 1 instantly — straight to dashboard.
      await supabaseAdmin.from("profiles").update({ kyc_level: 1, kyc_status: "verified" }).eq("id", context.userId);
      await supabaseAdmin.from("kyc_documents").insert({
        user_id: context.userId, kyc_level: 1, verification_status: "approved",
        admin_notes: "BVN verified instantly via bank account match.",
      });
    }
    return { success: true, error: null, rejected: false };
  });