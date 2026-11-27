// Phone OTP via Termii (https://developer.termii.com)
// Actions: { action: "send", phone? } | { action: "verify", code }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkAdaptiveLimit, limitResponse } from "../_shared/adaptive-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeNigerianE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("234") && digits.length === 13) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  if (raw.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0]?.trim();
  return first || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "";
}

// Termii expects MSISDN without the leading "+" (e.g. 23480...)
function toTermiiMsisdn(e164: string): string {
  return e164.replace(/^\+/, "");
}

async function sendTermiiSms(to: string, body: string) {
  const apiKey = Deno.env.get("TERMII_API_KEY");
  const fromRaw = Deno.env.get("TERMII_SENDER_ID") || "KukaPay";
  if (!apiKey) throw new Error("TERMII_API_KEY missing");

  const payload = {
    to: toTermiiMsisdn(to),
    from: fromRaw,
    sms: body,
    type: "plain",
    channel: "generic",
    api_key: apiKey,
  };

  const res = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok || (data && data.code && data.code !== "ok")) {
    console.error("[phone-otp] Termii error", res.status, data);
    const err: any = new Error(`Termii ${res.status}`);
    err.termiiStatus = res.status;
    err.termiiCode = data?.code;
    err.termiiMessage = data?.message;
    throw err;
  }
  return data;
}

serve(async (req): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonRes({ success: false, error: "Unauthorized" }, 401);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return jsonRes({ success: false, error: "Unauthorized" }, 401);

    const otpLimit = await checkAdaptiveLimit(supabase, req, "phone_otp", 10, 60);
    if (!otpLimit.allowed) return limitResponse(otpLimit, corsHeaders);

    const ip = getClientIp(req);
    const { action, phone, code } = await req.json();

    if (action === "send") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone_number, phone_verified_at")
        .eq("id", user.id)
        .single();

      if (profile?.phone_verified_at) {
        return jsonRes({ success: false, error: "Phone already verified" });
      }

      const rawPhone = (phone || profile?.phone_number || "").toString().trim();
      const e164 = normalizeNigerianE164(rawPhone);
      if (!e164) return jsonRes({ success: false, error: "Invalid phone number" });

      const { data: limitData, error: limitErr } = await supabase.rpc("check_otp_rate_limits", {
        p_user_id: user.id,
        p_phone: e164,
        p_ip: ip,
      });
      if (limitErr) {
        console.error("[phone-otp] rate-limit check failed", limitErr);
        return jsonRes({ success: false, error: "Service temporarily unavailable" }, 500);
      }
      if (limitData && !(limitData as any).allowed) {
        await supabase.from("phone_otp_attempts").insert({
          user_id: user.id, phone_e164: e164, ip, action: "send",
          success: false, reason: (limitData as any).reason,
        });
        return jsonRes({
          success: false,
          error: (limitData as any).reason || "Too many requests",
          retry_after_seconds: (limitData as any).retry_after_seconds,
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await sha256Hex(otp);
      const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();

      const { error: insErr } = await supabase.from("phone_otps").insert({
        user_id: user.id,
        phone_e164: e164,
        code_hash: codeHash,
        expires_at: expiresAt,
      });
      if (insErr) {
        console.error("[phone-otp] insert error", insErr);
        return jsonRes({ success: false, error: "Failed to create code" }, 500);
      }

      try {
        await sendTermiiSms(e164, `Your KukaPay verification code is ${otp}. Expires in 10 minutes.`);
      } catch (e: any) {
        console.error("[phone-otp] sms failed", e);
        await supabase.from("phone_otp_attempts").insert({
          user_id: user.id, phone_e164: e164, ip, action: "send",
          success: false, reason: `termii:${e?.termiiCode ?? e?.termiiStatus ?? "unknown"}`,
        });
        return jsonRes({ success: false, error: "Couldn't send SMS right now. Please try again shortly." }, 502);
      }

      await supabase.from("phone_otp_attempts").insert({
        user_id: user.id, phone_e164: e164, ip, action: "send", success: true,
      });

      const masked = e164.slice(0, 4) + "****" + e164.slice(-3);
      return jsonRes({ success: true, phone_masked: masked });
    }

    if (action === "verify") {
      if (!code || !/^\d{6}$/.test(code.toString())) {
        return jsonRes({ success: false, error: "Enter the 6-digit code" });
      }

      const { data: limitData } = await supabase.rpc("check_otp_rate_limits", {
        p_user_id: user.id,
        p_phone: "",
        p_ip: ip,
      });
      if (limitData && !(limitData as any).allowed && /failed attempts/i.test((limitData as any).reason || "")) {
        return jsonRes({ success: false, error: (limitData as any).reason });
      }

      const { data, error } = await supabase.rpc("consume_phone_otp", {
        p_user_id: user.id,
        p_code: code.toString(),
      });
      if (error) {
        console.error("[phone-otp] verify error", error);
        await supabase.from("phone_otp_attempts").insert({
          user_id: user.id, ip, action: "verify", success: false, reason: "rpc_error",
        });
        return jsonRes({ success: false, error: "Verification failed" }, 500);
      }

      const ok = !!(data as any)?.success;
      await supabase.from("phone_otp_attempts").insert({
        user_id: user.id, ip, action: "verify", success: ok,
        reason: ok ? null : ((data as any)?.error || "invalid"),
      });
      return jsonRes(data);
    }

    return jsonRes({ success: false, error: "Unknown action" });
  } catch (err) {
    console.error("[phone-otp] unhandled", err);
    return jsonRes({ success: false, error: "Unexpected error" }, 500);
  }
});
