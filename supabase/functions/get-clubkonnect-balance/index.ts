import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ success: false, error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) return json({ success: false, error: "Unauthorized", details: userError?.message }, 401);

    const { data: roleCheck, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError || !roleCheck) {
      return json({
        success: false,
        error: "Forbidden",
        details: roleError?.message || `No admin role found for ${user.email ?? user.id}`,
      }, 403);
    }

    const ckUserId = Deno.env.get("CLUBKONNECT_USER_ID");
    const ckApiKey = Deno.env.get("CLUBKONNECT_API_KEY");
    if (!ckUserId || !ckApiKey) {
      return json({ success: false, error: "Clubkonnect credentials not configured" }, 503);
    }
    console.log(`[get-clubkonnect-balance] using configured UserID=${ckUserId} (apiKey set: ${!!ckApiKey})`);

    const url = `https://www.nellobytesystems.com/APIWalletBalanceV1.asp?UserID=${encodeURIComponent(ckUserId)}&APIKey=${encodeURIComponent(ckApiKey)}`;
    const res = await fetch(url);
    const text = (await res.text()).trim();
    console.log("clubkonnect raw balance response:", text);

    let raw: any = text;
    try { raw = JSON.parse(text); } catch { /* keep as text */ }

    const toNum = (v: unknown): number | null => {
      if (v == null) return null;
      const n = Number(String(v).replace(/[,\s₦]/g, ""));
      return Number.isFinite(n) ? n : null;
    };

    let balance: number | null = null;
    if (Array.isArray(raw)) {
      balance = toNum(raw[0]);
    } else if (typeof raw === "object" && raw !== null) {
      const keys = ["balance", "Balance", "wallet_balance", "Wallet_Balance", "WalletBalance"];
      for (const k of keys) {
        if (raw[k] != null) { balance = toNum(raw[k]); break; }
      }
      if (balance == null) {
        // case-insensitive scan fallback
        for (const k of Object.keys(raw)) {
          if (/balance/i.test(k)) { balance = toNum(raw[k]); if (balance != null) break; }
        }
      }
    } else {
      balance = toNum(raw);
    }

    return json({ success: true, balance, raw, configuredUserId: ckUserId });
  } catch (e) {
    console.error("get-clubkonnect-balance error", e);
    return json({ success: false, error: (e as Error).message }, 500);
  }
});
