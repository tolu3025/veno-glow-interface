import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { checkAdaptiveLimit, limitResponse } from "../_shared/adaptive-limit.ts";
import { amountBlock, detailsTable, formatNaira, renderEmail, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Legacy SHA-256 hash for migration support */
async function legacySha256(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hash PIN with bcrypt (no worker — all sync) */
function hashPin(pin: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(pin, salt);
}

/** Verify PIN: try bcrypt first, fallback to legacy SHA-256, auto-migrate */
async function verifyPin(
  pin: string,
  storedHash: string,
  userId: string,
  adminClient: any
): Promise<boolean> {
  // Bcrypt hashes start with $2
  if (storedHash.startsWith("$2")) {
    return bcrypt.compareSync(pin, storedHash);
  }

  // Legacy SHA-256 check
  const sha256Hash = await legacySha256(pin);
  if (sha256Hash === storedHash) {
    // Auto-migrate to bcrypt
    const bcryptHash = await hashPin(pin);
    await adminClient
      .from("profiles")
      .update({ transaction_pin_hash: bcryptHash })
      .eq("id", userId);
    return true;
  }

  return false;
}

function jsonResp(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }

    const senderId = claimsData.claims.sub;
    const body = await req.json();
    const { action } = body;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const limit = await checkAdaptiveLimit(adminClient, req, "p2p_transfer", 20, 60);
    if (!limit.allowed) return limitResponse(limit, corsHeaders);

    // ── SET PIN ──
    if (action === "set_pin") {
      const { pin } = body;
      if (!pin || !/^\d{4}$/.test(pin)) {
        return jsonResp({ error: "PIN must be exactly 4 digits" }, 400);
      }

      const pinHash = await hashPin(pin);
      const { error } = await adminClient
        .from("profiles")
        .update({ transaction_pin_hash: pinHash })
        .eq("id", senderId);

      if (error) {
        console.error("[p2p-transfer] Set PIN error:", error);
        return jsonResp({ error: "Failed to set PIN" }, 500);
      }

      return jsonResp({ success: true });
    }

    // ── CHANGE PIN ──
    if (action === "change_pin") {
      const { current_pin, new_pin } = body;
      if (!current_pin || !/^\d{4}$/.test(current_pin) || !new_pin || !/^\d{4}$/.test(new_pin)) {
        return jsonResp({ error: "PINs must be exactly 4 digits" }, 400);
      }

      // Check lockout
      const { data: lockStatus } = await adminClient.rpc("check_pin_lockout", { p_user_id: senderId });
      if (lockStatus?.locked) {
        return jsonResp({ error: lockStatus.message, locked: true }, 403);
      }

      const { data: profile } = await adminClient
        .from("profiles")
        .select("transaction_pin_hash")
        .eq("id", senderId)
        .single();

      if (!profile?.transaction_pin_hash) {
        return jsonResp({ error: "No PIN set. Use set_pin first." }, 400);
      }

      const valid = await verifyPin(current_pin, profile.transaction_pin_hash, senderId, adminClient);
      if (!valid) {
        await adminClient.rpc("record_failed_pin", { p_user_id: senderId });
        return jsonResp({ error: "Incorrect current PIN" }, 401);
      }

      await adminClient.rpc("reset_pin_attempts", { p_user_id: senderId });
      const newHash = await hashPin(new_pin);
      await adminClient
        .from("profiles")
        .update({ transaction_pin_hash: newHash })
        .eq("id", senderId);

      return jsonResp({ success: true });
    }

    // ── SEARCH RECIPIENT ──
    if (action === "search") {
      const { query } = body;
      if (!query || query.trim().length < 2) {
        return jsonResp({ results: [] });
      }

      const searchTerm = query.trim();
      const { data: results } = await adminClient
        .from("profiles")
        .select("id, full_name, matric_number, university")
        .or(`matric_number.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .neq("id", senderId)
        .limit(5);

      return jsonResp({
        results: (results || []).map((r) => ({
          id: r.id,
          full_name: r.full_name,
          matric_number: r.matric_number,
          university: r.university,
        })),
      });
    }

    // ── TRANSFER ──
    if (action === "transfer") {
      const { recipient_id, amount, pin, note } = body;

      if (!recipient_id || !amount || !pin) {
        return jsonResp({ error: "Missing required fields" }, 400);
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0 || numAmount > 100000) {
        return jsonResp(
          { error: numAmount > 100000 ? "Daily limit is ₦100,000 for Level 1" : "Invalid amount" },
          400
        );
      }

      if (!/^\d{4}$/.test(pin)) {
        return jsonResp({ error: "Invalid PIN format" }, 400);
      }

      if (recipient_id === senderId) {
        return jsonResp({ error: "Cannot send to yourself" }, 400);
      }

      // Check lockout
      const { data: lockStatus } = await adminClient.rpc("check_pin_lockout", { p_user_id: senderId });
      if (lockStatus?.locked) {
        return jsonResp({ error: lockStatus.message, locked: true }, 403);
      }

      // Verify PIN
      const { data: senderProfile } = await adminClient
        .from("profiles")
        .select("transaction_pin_hash, kyc_level, full_name")
        .eq("id", senderId)
        .single();

      if (!senderProfile?.transaction_pin_hash) {
        return jsonResp({ error: "Transaction PIN not set" }, 400);
      }

      const pinValid = await verifyPin(pin, senderProfile.transaction_pin_hash, senderId, adminClient);
      if (!pinValid) {
        const { data: failResult } = await adminClient.rpc("record_failed_pin", { p_user_id: senderId });
        const msg = failResult?.locked
          ? "Account locked for 30 minutes due to failed PIN attempts."
          : `Incorrect PIN. ${failResult?.remaining || 0} attempts remaining.`;
        return jsonResp({ error: msg, locked: failResult?.locked }, 401);
      }

      await adminClient.rpc("reset_pin_attempts", { p_user_id: senderId });

      // Check daily transfer limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayTxns } = await adminClient
        .from("transactions")
        .select("amount")
        .eq("user_id", senderId)
        .eq("type", "p2p_transfer")
        .eq("status", "completed")
        .gte("created_at", today.toISOString());

      const todayTotal = (todayTxns || []).reduce((sum, t) => sum + Number(t.amount), 0);
      const dailyLimit = senderProfile.kyc_level >= 2 ? 500000 : 100000;
      if (todayTotal + numAmount > dailyLimit) {
        return jsonResp(
          { error: `Daily limit exceeded. Remaining: ₦${(dailyLimit - todayTotal).toLocaleString()}` },
          400
        );
      }

      // Execute atomic transfer
      const { data: result, error: rpcError } = await adminClient.rpc("execute_p2p_transfer", {
        p_sender_id: senderId,
        p_recipient_id: recipient_id,
        p_amount: numAmount,
        p_note: note || null,
      });

      if (rpcError) {
        console.error("[p2p-transfer] RPC error:", rpcError);
        return jsonResp({ error: "Transfer failed. Please try again." }, 500);
      }

      if (!result.success) {
        return jsonResp({ error: result.error }, 400);
      }

      // In-app notifications for both parties
      try {
        const amtFmt = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(numAmount);
        const senderName = senderProfile.full_name || "A KukaPay user";
        const { data: recipientProfile } = await adminClient
          .from("profiles").select("full_name").eq("id", recipient_id).maybeSingle();
        const recipientName = recipientProfile?.full_name || "recipient";

        await adminClient.rpc("create_notification", {
          p_user_id: senderId,
          p_title: "Transfer Successful",
          p_message: `${amtFmt} sent to ${recipientName}. Reference ${result.reference}.`,
          p_type: "transfer",
          p_metadata: { reference: result.reference, amount: numAmount, recipient_id, direction: "debit", note: note || null },
        });
        await adminClient.rpc("create_notification", {
          p_user_id: recipient_id,
          p_title: "Money Received",
          p_message: `${amtFmt} from ${senderName}${note ? ` — “${note}”` : ""}.`,
          p_type: "transfer",
          p_metadata: { reference: result.reference, amount: numAmount, sender_id: senderId, direction: "credit", note: note || null },
        });
      } catch (notifyErr) {
        console.error("[p2p-transfer] notification failed:", notifyErr);
      }

      // Email receipts for both parties
      try {
        const senderName = senderProfile.full_name || "A KukaPay user";
        const { data: recipProfile } = await adminClient
          .from("profiles").select("full_name").eq("id", recipient_id).maybeSingle();
        const recipientName = recipProfile?.full_name || "Recipient";
        const when = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" });

        const { data: senderUser } = await adminClient.auth.admin.getUserById(senderId);
        const { data: recipientUser } = await adminClient.auth.admin.getUserById(recipient_id);

        const rows: Array<[string, string]> = [
          ["Reference", String(result.reference)],
          ["Date", when],
        ];
        if (note) rows.splice(0, 0, ["Note", String(note)]);

        const senderEmail = senderUser?.user?.email;
        if (senderEmail) {
          const html = renderEmail({
            title: "Transfer successful",
            heading: "Transfer successful",
            intro: `You sent money to ${recipientName} on KukaPay. Here's your receipt.`,
            body: amountBlock(formatNaira(numAmount), "Amount sent") +
              `<div style="height:20px;"></div>` +
              detailsTable([["Sent to", recipientName], ...rows]),
            footer: `Didn't make this transfer? Contact <a href="mailto:support@kukapay.com.ng" style="color:#22b9ad;text-decoration:none;font-weight:600;">support@kukapay.com.ng</a> or WhatsApp 08148698365 immediately.`,
          });
          await sendEmail(senderEmail, `Transfer successful — ${formatNaira(numAmount)} sent`, html);
        }

        const recipientEmail = recipientUser?.user?.email;
        if (recipientEmail) {
          const html = renderEmail({
            title: "Money received",
            heading: "Your funds have landed",
            intro: `${senderName} sent you money on KukaPay.`,
            body: amountBlock(formatNaira(numAmount), "Amount credited") +
              `<div style="height:20px;"></div>` +
              detailsTable([["From", senderName], ...rows]),
            footer: `Questions? Contact <a href="mailto:support@kukapay.com.ng" style="color:#22b9ad;text-decoration:none;font-weight:600;">support@kukapay.com.ng</a> or WhatsApp 08148698365.`,
          });
          await sendEmail(recipientEmail, `You received ${formatNaira(numAmount)} on KukaPay`, html);
        }
      } catch (mailErr) {
        console.error("[p2p-transfer] email failed:", mailErr);
      }

      return jsonResp({
        success: true,
        reference: result.reference,
        new_balance: result.new_balance,
      });
    }

    return jsonResp({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("[p2p-transfer] Unhandled error:", error);
    return jsonResp({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
