import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { grantCashback } from "../_shared/cashback.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NETWORK_CODE: Record<string, string> = {
  mtn: "01",
  glo: "02",
  "9mobile": "03",
  airtel: "04",
};

// Clubkonnect MOBILE_NETWORK keys (mixed-case in their JSON)
const NETWORK_API_KEY: Record<string, string> = {
  mtn: "MTN",
  glo: "Glo",
  airtel: "Airtel",
  "9mobile": "m_9mobile",
};

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function legacySha256(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPin(pin: string, storedHash: string, userId: string, adminClient: any): Promise<boolean> {
  if (storedHash.startsWith("$2")) return bcrypt.compareSync(pin, storedHash);
  const sha = await legacySha256(pin);
  if (sha === storedHash) {
    const newHash = bcrypt.hashSync(pin, 10);
    await adminClient.from("profiles").update({ transaction_pin_hash: newHash }).eq("id", userId);
    return true;
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const ckUserId = Deno.env.get("CLUBKONNECT_USER_ID");
    const ckApiKey = Deno.env.get("CLUBKONNECT_API_KEY");
    if (!ckUserId || !ckApiKey) {
      return jsonRes({ success: false, error: "Service temporarily unavailable" }, 503);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonRes({ success: false, error: "Unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonRes({ success: false, error: "Unauthorized" }, 401);

    const { network, phone, plan_id, pin } = await req.json();
    if (!network || !phone || !plan_id || !pin) return jsonRes({ success: false, error: "Invalid input" }, 400);
    if (!NETWORK_CODE[network]) return jsonRes({ success: false, error: "Invalid network" }, 400);
    if (!/^0[789]\d{9}$/.test(phone)) return jsonRes({ success: false, error: "Invalid phone number" }, 400);

    // PIN lockout
    const { data: lockStatus } = await supabase.rpc("check_pin_lockout", { p_user_id: user.id });
    if (lockStatus?.locked) return jsonRes({ success: false, error: lockStatus.message, locked: true }, 403);

    // Lookup plan price (re-fetch to prevent client tampering)
    // Use V1 listing — its PRODUCT_ID is what V1 purchase accepts as DataPlan.
    const planRes = await fetch(
      `https://www.nellobytesystems.com/APIDatabundlePlans.asp?UserID=${encodeURIComponent(ckUserId)}&APIKey=${encodeURIComponent(ckApiKey)}`,
    );
    let planData: any;
    try { planData = JSON.parse(await planRes.text()); } catch {
      return jsonRes({ success: false, error: "Failed to verify plan" }, 502);
    }
    const networks = planData?.MOBILE_NETWORK ?? {};
    const networkBlock = networks[NETWORK_API_KEY[network]] ?? null;
    const rawPlans: any[] = [];
    if (Array.isArray(networkBlock)) {
      for (const entry of networkBlock) {
        if (Array.isArray(entry?.PRODUCT)) rawPlans.push(...entry.PRODUCT);
      }
    }
    const plan = rawPlans.find((p) => String(p.PRODUCT_ID) === String(plan_id));
    if (!plan) return jsonRes({ success: false, error: "Plan not found" }, 400);
    const amount = Number(plan.PRODUCT_AMOUNT);
    if (!amount || amount <= 0) return jsonRes({ success: false, error: "Invalid plan price" }, 400);
    const planName = String(plan.PRODUCT_NAME ?? "Data Plan");
    const planValidity = "";

    // Verify PIN
    const { data: profile } = await supabase
      .from("profiles").select("transaction_pin_hash").eq("id", user.id).single();
    if (!profile?.transaction_pin_hash) return jsonRes({ success: false, error: "Transaction PIN not set" }, 400);

    const pinValid = await verifyPin(pin, profile.transaction_pin_hash, user.id, supabase);
    if (!pinValid) {
      const { data: failResult } = await supabase.rpc("record_failed_pin", { p_user_id: user.id });
      const msg = failResult?.locked
        ? "Account locked for 30 minutes due to failed PIN attempts."
        : `Incorrect PIN. ${failResult?.remaining || 0} attempts remaining.`;
      return jsonRes({ success: false, error: msg, locked: failResult?.locked });
    }
    await supabase.rpc("reset_pin_attempts", { p_user_id: user.id });

    // Balance check
    const { data: wallet } = await supabase
      .from("wallets").select("id, balance, available_balance").eq("user_id", user.id).single();
    if (!wallet || Number(wallet.available_balance ?? wallet.balance) < amount) {
      return jsonRes({ success: false, error: "Insufficient balance" });
    }

    const reference = `DATA-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const requestId = reference; // Clubkonnect needs unique RequestID

    // Debit wallet first (refund on failure) — keep balance + available_balance in sync
    await supabase.from("wallets").update({
      balance: Number(wallet.balance) - amount,
      available_balance: Number(wallet.available_balance ?? wallet.balance) - amount,
    }).eq("id", wallet.id);


    // Call Clubkonnect — V1 is the only purchase endpoint (V2 exists only for plans listing)
    const ckUrl = `https://www.nellobytesystems.com/APIDatabundleV1.asp?UserID=${encodeURIComponent(ckUserId)}&APIKey=${encodeURIComponent(ckApiKey)}&MobileNetwork=${NETWORK_CODE[network]}&DataPlan=${encodeURIComponent(plan_id)}&MobileNumber=${encodeURIComponent(phone)}&RequestID=${encodeURIComponent(requestId)}`;
    console.log(`[purchase-clubkonnect-data] ${reference} → network=${network}(${NETWORK_CODE[network]}) DataPlan=${plan_id} ₦${amount} phone=${phone}`);

    let ckData: any;
    try {
      const ckRes = await fetch(ckUrl);
      const ckText = await ckRes.text();
      console.log(`[purchase-clubkonnect-data] CK status=${ckRes.status} body=${ckText.slice(0, 400)}`);
      try { ckData = JSON.parse(ckText); }
      catch { ckData = { raw: ckText, statuscode: "unknown" }; }
    } catch (e) {
      console.error("[purchase-clubkonnect-data] Network error:", e);
      // Refund
      await supabase.from("wallets").update({ balance: Number(wallet.balance), available_balance: Number(wallet.available_balance ?? wallet.balance) }).eq("id", wallet.id);

      return jsonRes({ success: false, error: "Provider unreachable. Please try again." }, 502);
    }

    // Clubkonnect success codes: 100 = order received, 200 = success
    const statusCode = String(ckData.statuscode ?? ckData.status ?? "");
    const ok = statusCode === "100" || statusCode === "200" || /ORDER_RECEIVED|SUCCESS/i.test(JSON.stringify(ckData));

    if (!ok) {
      // Refund
      await supabase.from("wallets").update({ balance: Number(wallet.balance), available_balance: Number(wallet.available_balance ?? wallet.balance) }).eq("id", wallet.id);
      const ckErr = ckData?.status || ckData?.statuscode || ckData?.message || ckData?.raw || "Data purchase failed at provider";
      const friendly = String(ckErr).includes("INVALID_DATAPLAN")
        ? "This data plan isn't enabled on our provider account. Please pick another plan."
        : `Provider: ${ckErr}`;
      return jsonRes({ success: false, error: friendly });
    }

    // Record transaction
    const { data: txRow } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "bill_payment" as const,
      amount,
      status: "completed",
      reference,
      metadata: {
        direction: "debit",
        purchase_type: "data",
        network, phone,
        plan_id, plan_name: planName, validity: planValidity,
        provider: "clubkonnect",
        provider_response: ckData,
      },
    }).select("id").single();

    const cashback = await grantCashback(supabase, user.id, reference, amount, "data");
    return jsonRes({ success: true, reference, transaction_id: txRow?.id ?? null, cashback });
  } catch (err) {
    console.error("[purchase-clubkonnect-data] Unhandled:", err);
    return jsonRes({ success: false, error: "An unexpected error occurred. Please try again." }, 500);
  }
});
