import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonRes(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonRes({ success: false, error: "Unauthorized" }, 401);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return jsonRes({ success: false, error: "Unauthorized" }, 401);

    const body = await req.json();
    const { action } = body;

    // ── CREATE DISPUTE ──
    if (action === "create_dispute") {
      const { transaction_id, reason, description } = body;

      if (!transaction_id || !reason || !description?.trim()) {
        return jsonRes({ success: false, error: "Transaction ID, reason, and description are required" });
      }

      const validReasons = ["wrong_recipient", "duplicate", "fraud", "other"];
      if (!validReasons.includes(reason)) {
        return jsonRes({ success: false, error: "Invalid reason" });
      }

      if (description.trim().length < 10) {
        return jsonRes({ success: false, error: "Description must be at least 10 characters" });
      }

      // Verify transaction belongs to user
      const { data: txn } = await supabase.from("transactions")
        .select("id, user_id").eq("id", transaction_id).single();
      if (!txn || txn.user_id !== user.id) {
        return jsonRes({ success: false, error: "Transaction not found" });
      }

      // Rate limit: max 2 disputes per day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("transaction_disputes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());

      if ((count || 0) >= 2) {
        return jsonRes({ success: false, error: "Maximum 2 disputes per day. Try again tomorrow." });
      }

      // Check for existing dispute on same transaction
      const { data: existing } = await supabase.from("transaction_disputes")
        .select("id").eq("transaction_id", transaction_id).eq("user_id", user.id)
        .not("status", "eq", "rejected").maybeSingle();

      if (existing) {
        return jsonRes({ success: false, error: "You already have an active dispute for this transaction" });
      }

      const { data: dispute, error: insertErr } = await supabase.from("transaction_disputes").insert({
        user_id: user.id,
        transaction_id,
        reason,
        description: description.trim(),
      }).select().single();

      if (insertErr) {
        console.error("[manage-disputes] Insert error:", insertErr);
        return jsonRes({ success: false, error: "Failed to create dispute" }, 500);
      }

      // Notify admins
      const { data: adminRoles } = await supabase.from("user_roles")
        .select("user_id").eq("role", "admin");

      for (const admin of adminRoles || []) {
        await supabase.rpc("create_notification", {
          p_user_id: admin.user_id,
          p_title: "New Transaction Dispute 🚩",
          p_message: `A user flagged a transaction (${reason})`,
          p_type: "admin",
          p_metadata: { dispute_id: dispute.id, transaction_id },
        });
      }

      return jsonRes({ success: true, dispute_id: dispute.id });
    }

    // ── RESOLVE DISPUTE (Admin only) ──
    if (action === "resolve_dispute") {
      const { dispute_id, resolution, admin_notes } = body;

      // Check admin role
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return jsonRes({ success: false, error: "Admin access required" }, 403);

      if (!dispute_id || !resolution) {
        return jsonRes({ success: false, error: "Dispute ID and resolution required" });
      }

      const validResolutions = ["resolved", "rejected"];
      if (!validResolutions.includes(resolution)) {
        return jsonRes({ success: false, error: "Invalid resolution" });
      }

      const { data: dispute } = await supabase.from("transaction_disputes")
        .select("*").eq("id", dispute_id).single();
      if (!dispute) return jsonRes({ success: false, error: "Dispute not found" });
      if (dispute.status === "resolved" || dispute.status === "rejected") {
        return jsonRes({ success: false, error: "Dispute already resolved" });
      }

      await supabase.from("transaction_disputes").update({
        status: resolution,
        admin_notes: admin_notes || null,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      }).eq("id", dispute_id);

      // Notify user
      await supabase.rpc("create_notification", {
        p_user_id: dispute.user_id,
        p_title: resolution === "resolved" ? "Dispute Resolved ✅" : "Dispute Rejected",
        p_message: resolution === "resolved"
          ? "Your transaction dispute has been resolved."
          : "Your transaction dispute has been reviewed and rejected.",
        p_type: "general",
        p_metadata: { dispute_id },
      });

      return jsonRes({ success: true });
    }

    return jsonRes({ success: false, error: "Unknown action" });
  } catch (err) {
    console.error("[manage-disputes] Unhandled error:", err);
    return jsonRes({ success: false, error: "An unexpected error occurred" }, 500);
  }
});
