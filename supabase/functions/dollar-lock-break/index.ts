// Break a Dollar Vault lock early with penalty
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({ lock_id: z.string().uuid() });

async function fetchMidRate(): Promise<number> {
  try {
    const { getFxRate } = await import("../_shared/flutterwave-v3.ts");
    const rate = await getFxRate("USD", "NGN", 100);
    if (rate) return rate;
  } catch {}
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    const j = await r.json();
    const ngn = Number(j?.rates?.NGN);
    if (ngn && ngn > 100) return ngn;
  } catch {}
  return Number(Deno.env.get("FLUTTERWAVE_FX_MID_RATE") ?? "1550");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ success: false, error: "Unauthorized" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ success: false, error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ success: false, error: parsed.error.flatten() }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Hard guard: reject any early-unlock attempt. Dollar Vault locks are
    // immutable until maturity — the mature-dollar-locks cron auto-releases.
    const { data: lockRow, error: lockErr } = await admin
      .from("dollar_locks")
      .select("status, mature_at, user_id")
      .eq("id", parsed.data.lock_id)
      .maybeSingle();
    if (lockErr || !lockRow) return json({ success: false, error: "Lock not found" }, 404);
    if (lockRow.user_id !== userId) return json({ success: false, error: "Forbidden" }, 403);
    if (lockRow.status !== "active") return json({ success: false, error: "Lock is not active" }, 400);
    if (new Date(lockRow.mature_at).getTime() > Date.now()) {
      return json({ success: false, error: "Locks cannot be broken early. Funds release automatically on the unlock date." }, 403);
    }

    // Matured but not yet processed by cron — release at par (no penalty).
    const rate = await fetchMidRate();
    const { data, error } = await admin.rpc("break_dollar_lock", {
      _user_id: userId, _lock_id: parsed.data.lock_id, _current_rate: rate,
    });
    if (error) throw error;
    const result = data as any;
    if (!result?.success) return json(result, 400);
    return json({ ...result, current_rate: rate });
  } catch (e) {
    console.error("[dollar-lock-break]", e);
    return json({ success: false, error: "Internal error" }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
