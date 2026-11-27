import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const body = await req.json();
    const { action } = body;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Helper: create a PERMANENT Flutterwave VA tied to the creator's BVN/NIN.
    // Permanent accounts accept any amount and never expire — what collections need.
    async function createPermanentVA(opts: { title: string; txRef: string }) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, phone_number")
        .eq("id", userId)
        .single();
      if (!profile?.full_name) {
        return { error: "Complete your profile (full name) before creating a collection." };
      }

      const { data: kycRows } = await adminClient
        .from("kyc_documents")
        .select("nin_number, bvn_number, verification_status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      const approved = (kycRows || []).filter((r: any) => r.verification_status === "approved");
      const pool = approved.length ? approved : (kycRows || []);
      const bvn = pool.find((r: any) => r.bvn_number)?.bvn_number;
      const nin = pool.find((r: any) => r.nin_number)?.nin_number;
      const identityNumber = bvn || nin;
      if (!identityNumber) {
        return { error: "Verify your identity (KYC) before creating a collection — we need it to issue a payment account that doesn't expire." };
      }

      const nameParts = profile.full_name.trim().split(/\s+/);
      const firstName = nameParts[0] || "Kuka";
      const lastName = nameParts.slice(1).join(" ") || "User";

      const { provisionVirtualAccount } = await import("../_shared/flutterwave-v3.ts");
      const r = await provisionVirtualAccount({
        email: user.email || `collection-${opts.txRef}@kukapay.com`,
        first_name: firstName,
        last_name: lastName,
        phone: profile.phone_number || undefined,
        bvn: bvn || undefined,
        nin: !bvn ? nin || undefined : undefined,
        reference: opts.txRef,
        narration: `Kukapay/${opts.title}`,
      });
      console.log("Collection VA response:", JSON.stringify(r));
      if (!r.ok) {
        return { error: r.error || "Could not create payment account. Please try again." };
      }
      return {
        virtualAccount: r.account_number,
        virtualBankName: r.bank_name,
        virtualAccountName: r.account_name,
        // Store OUR tx_ref — Flutterwave echoes this on every payment into the permanent VA,
        // which is how the webhook matches the payment back to this collection.
        flwReference: opts.txRef,
      };
    }

    // ── CREATE COLLECTION ──
    if (action === "create") {
      const { title, description, target_amount, amount_per_person, deadline, category, require_matric } = body;

      if (!title || !target_amount) {
        return new Response(JSON.stringify({ error: "Title and target amount are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const txRef = `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const va = await createPermanentVA({ title, txRef });
      if ("error" in va) {
        return new Response(JSON.stringify({ error: va.error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Insert collection
      const { data: collection, error } = await adminClient
        .from("collections")
        .insert({
          creator_id: userId,
          title,
          description: description || null,
          target_amount: Number(target_amount),
          amount_per_person: amount_per_person ? Number(amount_per_person) : null,
          deadline: deadline || null,
          category: category || "other",
          require_matric: require_matric === true,
          virtual_account_number: va.virtualAccount,
          virtual_bank_name: va.virtualBankName,
          virtual_account_name: va.virtualAccountName,
          flutterwave_reference: va.flwReference,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert collection error:", error);
        return new Response(JSON.stringify({ error: "Failed to create collection" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          collection: { ...collection, virtual_bank_name: va.virtualBankName, virtual_account_name: va.virtualAccountName },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Regenerating the VA was removed — the virtual account is permanent and reusable.



    // ── PAY WITH WALLET ──
    if (action === "pay_wallet") {
      const { collection_id, amount, payer_name, payer_matric } = body;

      if (!collection_id || !amount || !payer_name || !payer_matric) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: result, error: rpcError } = await adminClient.rpc("pay_collection_from_wallet", {
        p_payer_id: userId,
        p_collection_id: collection_id,
        p_amount: Number(amount),
        p_payer_name: payer_name,
        p_payer_matric: payer_matric,
      });

      if (rpcError) {
        console.error("Collection payment RPC error:", rpcError);
        return new Response(JSON.stringify({ error: "Payment failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, reference: result.reference }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── CLOSE COLLECTION ──
    if (action === "close") {
      const { collection_id } = body;

      const { data: col } = await adminClient
        .from("collections")
        .select("*")
        .eq("id", collection_id)
        .eq("creator_id", userId)
        .single();

      if (!col) {
        return new Response(JSON.stringify({ error: "Collection not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient
        .from("collections")
        .update({ status: "completed" })
        .eq("id", collection_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Collection error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
