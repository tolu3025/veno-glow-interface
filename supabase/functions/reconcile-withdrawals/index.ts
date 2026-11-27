// Polls Flutterwave for every withdrawal stuck in `pending`/`processing`
// older than 5 minutes and settles/refunds it through the audited posting engine.
// Scheduled via pg_cron every 10 minutes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDirectTransfer } from "../_shared/flutterwave-v3.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const summary = { checked: 0, completed: 0, refunded: 0, still_pending: 0, errors: 0 };

  try {
    const { data: stuck, error } = await admin
      .from("withdrawals")
      .select("id, user_id, amount, fee_amount, bank_name, flutterwave_transfer_ref, status, created_at")
      .in("status", ["pending", "processing"])
      .not("flutterwave_transfer_ref", "is", null)
      .lte("created_at", cutoff)
      .limit(100);

    if (error) throw error;

    for (const w of stuck || []) {
      summary.checked++;
      try {
        const r = await getDirectTransfer(w.flutterwave_transfer_ref!);
        const body: any = r.raw;
        const status = String(r.data?.status || body?.data?.status || "").toUpperCase();

        if (status === "SUCCESSFUL") {
          // Atomic claim + engine-backed settlement (releases hold, posts debit).
          const { data: res, error: rpcErr } = await admin.rpc("settle_withdrawal_by_id", {
            _withdrawal_id: w.id,
            _source: "poller",
          });
          if (rpcErr) throw rpcErr;
          if ((res as any)?.success) summary.completed++;
        } else if (status === "FAILED") {
          // Release the hold only — funds were never debited, so crediting
          // the wallet here would create a ghost credit.
          const { data: res, error: rpcErr } = await admin.rpc("refund_withdrawal_by_id", {
            _withdrawal_id: w.id,
            _reason: "provider_failed",
            _source: "poller",
          });
          if (rpcErr) throw rpcErr;
          if ((res as any)?.success) summary.refunded++;
        } else {
          // NEW / PENDING — leave alone, retry next run
          summary.still_pending++;
        }
      } catch (e) {
        summary.errors++;
        console.error("reconcile-withdrawals", w.id, e);
      }
    }

    await admin.rpc("record_reconciliation_run", {
      _job: "reconcile-withdrawals",
      _checked: summary.checked,
      _settled: summary.completed,
      _refunded: summary.refunded,
      _flagged: 0,
      _errors: summary.errors,
      _details: summary,
    });

    console.log("[reconcile-withdrawals]", summary);
    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("reconcile-withdrawals fatal", e);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
