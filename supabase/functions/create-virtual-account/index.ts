import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { provisionVirtualAccount } from "../_shared/flutterwave-v3.ts";
import { checkNin } from "../_shared/nin-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse optional body for NIN recovery (edge case: KYC approved but NIN not stored)
  let bodyNin: string | null = null;
  try {
    const body = await req.json();
    bodyNin = body?.nin_number || null;
  } catch {
    // No body — that's fine
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if wallet already has a virtual account
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("virtual_account_number, flutterwave_reference")
      .eq("user_id", user.id)
      .single();

    if (wallet?.virtual_account_number) {
      return new Response(
        JSON.stringify({
          success: true,
          already_exists: true,
          account_number: wallet.virtual_account_number,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profile for user details
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone_number")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get NIN from kyc_documents — normally stored during KYC Level 1 verification
    const { data: kycDocs } = await supabaseAdmin
      .from("kyc_documents")
      .select("nin_number, id")
      .eq("user_id", user.id)
      .not("nin_number", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    let ninNumber = kycDocs?.[0]?.nin_number || null;

    // Fallback: if NIN missing in DB but provided in request body (recovery for legacy users)
    if (!ninNumber && bodyNin) {
      ninNumber = bodyNin;
      // Save NIN to existing kyc_documents row
      await supabaseAdmin
        .from("kyc_documents")
        .update({ nin_number: bodyNin })
        .eq("user_id", user.id)
        .is("nin_number", null);
      console.log("NIN recovered from user input for:", user.id);
    }

    if (!ninNumber) {
      console.error("NIN not found in kyc_documents for user:", user.id);
      return new Response(JSON.stringify({ 
        nin_required: true,
        message: "Your NIN wasn't saved during verification. Please enter it to create your virtual account.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Never issue an account against a NIN that doesn't exist or belongs to
    // someone else — even if an admin approved the document by mistake.
    const ninCheck = await checkNin(ninNumber, profile.full_name || "");
    await supabaseAdmin
      .from("kyc_documents")
      .update({
        nin_verified: ninCheck.status === "match" ? true : ninCheck.status === "unavailable" ? null : false,
        nin_verified_name: ninCheck.name,
        nin_check_notes: ninCheck.message,
      })
      .eq("user_id", user.id)
      .eq("kyc_level", 1);

    if (ninCheck.status === "mismatch" || ninCheck.status === "not_found") {
      await supabaseAdmin
        .from("profiles")
        .update({ kyc_status: "rejected", kyc_level: 0 })
        .eq("id", user.id);
      await supabaseAdmin
        .from("kyc_documents")
        .update({ verification_status: "rejected", admin_notes: ninCheck.message })
        .eq("user_id", user.id)
        .eq("kyc_level", 1);
      await supabaseAdmin.from("notifications").insert({
        user_id: user.id,
        title: "NIN verification failed",
        body: `${ninCheck.message} Please resubmit your KYC with the correct NIN — no account number was created.`,
        type: "kyc",
      });
      return new Response(
        JSON.stringify({
          nin_invalid: true,
          error: ninCheck.message,
          message: `${ninCheck.message} We couldn't create your account number. Please resubmit your KYC with the correct NIN.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const txRef = `kuka-va-${user.id.slice(0, 8)}-${Date.now()}`;
    const nameParts = profile.full_name.split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "KukaPay";

    const provisioned = await provisionVirtualAccount({
      email: user.email!,
      first_name: firstName,
      last_name: lastName,
      phone: profile.phone_number || undefined,
      nin: ninNumber,
      reference: txRef,
      narration: "Kukapay",
    });

    if (!provisioned.ok) {
      console.error("Flutterwave v3 VA error:", provisioned.raw);
      return new Response(
        JSON.stringify({
          error: "Failed to create virtual account",
          details: provisioned.error,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update wallet with virtual account details
    const { error: updateError } = await supabaseAdmin
      .from("wallets")
      .update({
        virtual_account_number: provisioned.account_number,
        virtual_bank_name: provisioned.bank_name,
        virtual_account_name: provisioned.account_name,
        flutterwave_reference: txRef,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Wallet update error:", updateError);
      throw new Error("Failed to save virtual account details");
    }

    return new Response(
      JSON.stringify({
        success: true,
        account_number: provisioned.account_number,
        bank_name: provisioned.bank_name,
        account_name: provisioned.account_name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Virtual account creation error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
