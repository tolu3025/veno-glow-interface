// Create a Dollar Vault savings challenge (Tier 3 KYC required)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHALLENGES: Record<number, string> = {
  7: "7-Day Starter 🌱",
  30: "30-Day Builder 🔨",
  90: "90-Day Semester 📚",
  180: "180-Day Planner 🗺️",
  365: "365-Day Graduate 🎓",
};

const Body = z.object({
  usd_amount: z.number().positive().min(1),
  lock_days: z.union([z.literal(7), z.literal(30), z.literal(90), z.literal(180), z.literal(365)]),
});

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
    const { usd_amount, lock_days } = parsed.data;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await admin.rpc("create_dollar_lock", {
      _user_id: userId,
      _usd: usd_amount,
      _days: lock_days,
      _challenge: CHALLENGES[lock_days],
    });
    if (error) throw error;
    const result = data as any;
    if (!result?.success) return json(result, 400);
    return json(result);
  } catch (e) {
    console.error("[dollar-lock-create]", e);
    return json({ success: false, error: "Internal error" }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
