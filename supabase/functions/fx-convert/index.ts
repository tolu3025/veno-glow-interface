// Consume an FX quote and move balances atomically.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({ quote_id: z.string().uuid() });

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
    const reference = `kukapay-vault-${userId.slice(0, 8)}-${Date.now()}`;
    const { data, error } = await admin.rpc("apply_fx_conversion", {
      _user_id: userId, _quote_id: parsed.data.quote_id, _reference: reference,
    });
    if (error) throw error;
    const result = data as any;
    if (!result?.success) return json({ ...result, reference }, 400);
    return json({ ...result, reference });
  } catch (e) {
    console.error("[fx-convert]", e);
    return json({ success: false, error: "Internal error" }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
