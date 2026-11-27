import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyChargeByReference } from "../_shared/flutterwave-v3.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // v4 client handles auth internally.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const summary = { checked: 0, skipped_non_provider: 0, ghost_reversed: 0, duplicates_reversed: 0, errors: 0 };

  // Only Flutterwave (bank/card) deposits can be verified here. Crypto (Breet)
  // conversions and internal credits are NOT known to Flutterwave and must never
  // be treated as ghost credits.
  const isProviderDeposit = (tx: any) => {
    const ref = String(tx.reference || "");
    const src = String(tx.metadata?.source || tx.metadata?.provider || "").toLowerCase();
    if (ref.startsWith("CRYPTO-") || ref.endsWith("-REV")) return false;
    if (["breet", "crypto", "internal"].includes(src)) return false;
    return ref.startsWith("FLW-") || !!tx.metadata?.flw_ref || !!tx.metadata?.tx_ref;
  };

  try {
    const { data: deposits } = await admin.from("transactions")
      .select("id, user_id, amount, reference, metadata")
      .eq("type", "deposit").eq("status", "completed").gte("created_at", since).limit(500);

    for (const tx of deposits || []) {
      if (!isProviderDeposit(tx)) { summary.skipped_non_provider++; continue; }
      summary.checked++;
      try {
        // Verify using the merchant tx_ref — that is what Flutterwave's
        // reference lookup expects. Using flw_ref returned "not found" and
        // wrongly reversed genuine deposits.
        const txId = (tx.metadata as any)?.tx_ref || tx.reference?.replace(/^FLW-/, "");
        if (!txId) { summary.skipped_non_provider++; continue; }
        const vr = await verifyChargeByReference(String(txId));
        const data: any = vr.raw || {};
        const record = Array.isArray(data?.data) ? data.data[0] : data?.data;
        const verifiedStatus = String(record?.status || "").toLowerCase();
        const verifiedAmount = Number(record?.amount ?? 0);

        // No record returned (API error / unknown reference) => flag only.
        if (!record || !verifiedStatus) {
          await admin.from("reconciliation_flags").insert({
            user_id: tx.user_id, reference: tx.reference,
            expected_amount: 0, actual_amount: tx.amount,
            flag_type: "unverifiable", auto_reversed: false,
          });
          continue;
        }

        const ok = verifiedStatus === "successful" || verifiedStatus === "success";
        if (!ok) {
          await admin.from("reconciliation_flags").insert({
            user_id: tx.user_id, reference: tx.reference,
            expected_amount: verifiedAmount, actual_amount: tx.amount,
            flag_type: "ghost_credit", auto_reversed: true,
          });
          await admin.rpc("reverse_ghost_credit", { _reference: tx.reference, _reason: "ghost_credit" });
          summary.ghost_reversed++;
        } else if (verifiedAmount !== Number(tx.amount)) {
          await admin.from("reconciliation_flags").insert({
            user_id: tx.user_id, reference: tx.reference,
            expected_amount: verifiedAmount, actual_amount: tx.amount,
            flag_type: "amount_mismatch", auto_reversed: false,
          });
        }
      } catch (e) { summary.errors++; console.error("recon tx", e); }
    }

    // Duplicate refs — flagged for human review only. Auto-reversing here has
    // clawed back genuine payments before.
    const { data: allDeps } = await admin.from("transactions")
      .select("reference, metadata").eq("type", "deposit").eq("status", "completed").gte("created_at", since).limit(2000);
    const counts = new Map<string, number>();
    (allDeps || []).filter(isProviderDeposit).forEach((r: any) => counts.set(r.reference, (counts.get(r.reference) || 0) + 1));
    for (const [ref, c] of counts) {
      if (c > 1) {
        await admin.from("reconciliation_flags").insert({
          reference: ref, flag_type: "duplicate", auto_reversed: false,
          expected_amount: 1, actual_amount: c,
        }).select().maybeSingle().then(() => {}, () => {});
        summary.duplicates_reversed++;
      }
    }


    await admin.rpc("record_reconciliation_run", {
      _job: "reconcile-deposits",
      _checked: summary.checked,
      _settled: 0,
      _refunded: summary.ghost_reversed + summary.duplicates_reversed,
      _flagged: summary.ghost_reversed + summary.duplicates_reversed,
      _errors: summary.errors,
      _details: summary,
    });

    return new Response(JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("reconcile", e);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
