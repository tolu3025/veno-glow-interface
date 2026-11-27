import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonRes(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Scheduled cron: flag errands whose delivery_deadline has passed and notify both parties.
// Idempotent — uses is_delayed flag so each errand is processed only once.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const nowIso = new Date().toISOString();

    // Find errands that are accepted/in_progress, past deadline, and not yet flagged
    const { data: overdue, error } = await supabase
      .from("errand_requests")
      .select("id, title, requester_id, helper_id, delivery_deadline")
      .in("status", ["accepted", "in_progress"])
      .eq("is_delayed", false)
      .not("delivery_deadline", "is", null)
      .lt("delivery_deadline", nowIso)
      .limit(200);

    if (error) {
      console.error("[check-errand-deadlines] query error:", error);
      return jsonRes({ success: false, error: error.message }, 500);
    }

    const list = (overdue ?? []) as Array<{
      id: string;
      title: string;
      requester_id: string;
      helper_id: string | null;
      delivery_deadline: string;
    }>;

    let processed = 0;
    for (const errand of list) {
      // Mark as delayed first to avoid duplicate notifications on overlapping runs
      const { error: updateErr } = await supabase
        .from("errand_requests")
        .update({ is_delayed: true })
        .eq("id", errand.id)
        .eq("is_delayed", false);

      if (updateErr) {
        console.error("[check-errand-deadlines] update failed", errand.id, updateErr);
        continue;
      }

      const minutesLate = Math.max(
        1,
        Math.floor((Date.now() - new Date(errand.delivery_deadline).getTime()) / 60000),
      );

      // Notify requester
      await supabase.rpc("create_notification", {
        p_user_id: errand.requester_id,
        p_title: "Errand Delayed ⏰",
        p_message: `"${errand.title}" is ${minutesLate} min past its deadline. Check in with your runner.`,
        p_type: "errand",
        p_metadata: { errand_id: errand.id, minutes_late: minutesLate },
      });

      // Notify helper (runner) if assigned
      if (errand.helper_id) {
        await supabase.rpc("create_notification", {
          p_user_id: errand.helper_id,
          p_title: "Errand Past Deadline ⏰",
          p_message: `Your errand "${errand.title}" is ${minutesLate} min overdue. Please complete it ASAP.`,
          p_type: "errand",
          p_metadata: { errand_id: errand.id, minutes_late: minutesLate },
        });
      }

      processed++;
    }

    return jsonRes({ success: true, processed, scanned: list.length });
  } catch (err: unknown) {
    console.error("[check-errand-deadlines] Unhandled:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return jsonRes({ success: false, error: message }, 500);
  }
});
