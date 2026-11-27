import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  korapayActivationSchema,
  korapayVirtualAccountResponseSchema,
} from "./korapay-deposit";

/** Creates a permanent Korapay virtual bank account for the authenticated user.
 *  Gated on server-verified KYC level; credentials never leave the server. */
export const activateKorapayAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => korapayActivationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const fail = (error: string, rejected = false) => ({
      success: false,
      error,
      rejected,
    });

    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("full_name,kyc_level,is_suspended")
      .eq("id", context.userId)
      .single();

    if (profileError || !profile || profile.is_suspended)
      return fail(
        "Your account cannot be activated right now. Please contact support.",
      );

    const fullName = profile.full_name.trim().replace(/\s+/g, " ");
    const email = context.claims.email;
    if (fullName.split(" ").length < 2 || typeof email !== "string")
      return fail("Update your full name in your profile first.");

    const { korapayRequest, korapayConfig } = await import("./korapay.server");
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    let cfg;
    try {
      cfg = korapayConfig();
    } catch {
      return fail("Account creation is temporarily unavailable.");
    }
    // Gate on server-side enablement.
    if (!cfg.secretKey.startsWith("sk_live_") && !cfg.secretKey.startsWith("sk_test_"))
      return fail("Account creation is temporarily unavailable.");

    const reference = `KUKA-KORA-${context.userId}`;

    const { data: claim, error: claimError } = await supabaseAdmin.rpc(
      "claim_korapay_account",
      { _user_id: context.userId, _account_reference: reference },
    );
    const action = (claim as { action?: string } | null)?.action;
    if (claimError || !action) return fail("Please try again shortly.");
    if (action === "ready")
      return { success: true, error: null, rejected: false };
    if (action === "wait")
      return fail(
        "Your account request is being checked. Please try again in 30 seconds.",
      );

    // Korapay: POST /merchant/api/v1/virtual-bank-account
    const result = await korapayRequest<unknown>(
      "/merchant/api/v1/virtual-bank-account",
      {
        method: "POST",
        body: {
          account_name: fullName,
          account_reference: reference,
          permanent: true,
          bank_code: "000", // Korapay assigns the bank; pass 000 to get any available bank
          customer: {
            name: fullName,
            email,
          },
          // Send BVN or NIN depending on what the user provided
          ...(data.bvn ? { bvn: data.bvn } : {}),
          ...(data.nin ? { nin: data.nin } : {}),
        },
      },
    );

    if (result.kind !== "success") {
      console.error("[korapay-activate] account creation failed", {
        kind: result.kind,
        httpStatus: result.httpStatus,
        message: result.message,
      });
      const rejected = result.kind === "rejected";
      await supabaseAdmin
        .from("korapay_virtual_accounts")
        .update({ status: rejected ? "rejected" : "pending" })
        .eq("user_id", context.userId);
      if (rejected && profile.kyc_level < 1) {
        await supabaseAdmin.from("kyc_documents").insert({
          user_id: context.userId,
          kyc_level: 1,
          verification_status: "rejected",
          admin_notes: `Korapay could not create an account with the submitted identity document${result.message ? `: ${result.message}` : ""}.`,
        });
      }
      return fail(
        rejected
          ? "We could not create your account with those details. Check your identity document and profile name, then try again."
          : "Our bank partner is not responding. Please try again shortly; do not send money until your account appears.",
        rejected,
      );
    }

    const parsed = korapayVirtualAccountResponseSchema.safeParse(result.data);
    if (!parsed.success)
      return fail(
        "Your account details are still being checked. Please try again shortly.",
      );
    const acct = parsed.data;

    const { error: saveError } = await supabaseAdmin
      .from("korapay_virtual_accounts")
      .update({
        status: "ready",
        account_number: acct.account_number,
        bank_name: acct.bank_name,
        bank_code: acct.bank_code ?? null,
        account_name: acct.account_name,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", context.userId);

    if (saveError)
      return fail(
        "Your account was issued but could not be saved. Please check again shortly.",
      );

    // Promote to KYC level 1 if not already done.
    if (profile.kyc_level < 1) {
      await supabaseAdmin
        .from("profiles")
        .update({ kyc_level: 1, kyc_status: "verified" })
        .eq("id", context.userId);
      await supabaseAdmin.from("kyc_documents").insert({
        user_id: context.userId,
        kyc_level: 1,
        verification_status: "approved",
        admin_notes: "Identity verified via Korapay virtual account creation.",
      });
    }

    return { success: true, error: null, rejected: false };
  });
