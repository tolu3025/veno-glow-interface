// Cron target: mature due dollar locks + send 24h reminders.
// Scheduled hourly so both timelines are covered by one entry point.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: matured, error: mErr } = await admin.rpc("mature_due_dollar_locks");
    if (mErr) throw mErr;
    const { data: notified, error: nErr } = await admin.rpc("remind_upcoming_dollar_locks");
    if (nErr) throw nErr;
    return new Response(JSON.stringify({ success: true, matured, notified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[mature-dollar-locks]", e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
