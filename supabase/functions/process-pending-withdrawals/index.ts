import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { listBanksNG, createDirectTransfer } from "../_shared/flutterwave-v3.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Find pending (non-instant) withdrawals older than 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: pendingWithdrawals, error: fetchError } = await adminClient
      .from("withdrawals")
      .select("*")
      .eq("status", "pending")
      .eq("is_instant", false)
      .lte("created_at", cutoff)
      .limit(20); // Process in batches

    if (fetchError) {
      console.error("[process-pending-withdrawals] Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingWithdrawals || pendingWithdrawals.length === 0) {
      console.log("[process-pending-withdrawals] No pending withdrawals to process.");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-pending-withdrawals] Processing ${pendingWithdrawals.length} withdrawals...`);

    let processed = 0;
    let failed = 0;

    for (const w of pendingWithdrawals) {
      try {
        // Mark as processing
        await adminClient
          .from("withdrawals")
          .update({ status: "processing" })
          .eq("id", w.id);

        // Resolve bank code from bank_name using v4 banks list
        const banks = await listBanksNG();
        const bank = banks.find(
          (b: any) => (b.name || "").toLowerCase() === (w.bank_name || "").toLowerCase(),
        );

        if (!bank) {
          console.error(`[process-pending-withdrawals] Could not find bank code for "${w.bank_name}", skipping withdrawal ${w.id}`);
          await adminClient.from("withdrawals").update({ status: "pending" }).eq("id", w.id);
          failed++;
          continue;
        }

        const reference = "WDR-AUTO-" + crypto.randomUUID();
        const transferResp = await createDirectTransfer({
          amount: Number(w.amount),
          account_number: w.account_number,
          account_bank: bank.code,
          reference,
          narration: `Kuka Pay Standard Withdrawal - ${reference}`,
          beneficiary_name: w.account_name || undefined,
        });
        const transferResult: any = transferResp.raw;

        if (transferResult.data?.id) {
          // Success — update withdrawal with transfer ref
          await adminClient
            .from("withdrawals")
            .update({
              status: "processing",
              flutterwave_transfer_ref: String(transferResult.data.id),
            })
            .eq("id", w.id);

          // Update associated transaction to completed
          await adminClient
            .from("transactions")
            .update({ status: "completed" })
            .eq("user_id", w.user_id)
            .eq("type", "withdrawal")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1);

          await adminClient.rpc("create_notification", {
            p_user_id: w.user_id,
            p_title: "Withdrawal Processing",
            p_message: `Your standard withdrawal of ₦${Number(w.amount).toLocaleString()} to ${w.bank_name} is now being processed.`,
            p_type: "withdrawal",
            p_metadata: { reference, amount: w.amount },
          });

          processed++;
          console.log(`[process-pending-withdrawals] Withdrawal ${w.id} sent to Flutterwave. Transfer ID: ${transferResult.data.id}`);
        } else {
          // Transfer failed — refund user
          console.error(`[process-pending-withdrawals] Transfer failed for ${w.id}:`, JSON.stringify(transferResult));

          // Get current wallet balance to refund
          const { data: wallet } = await adminClient
            .from("wallets")
            .select("id, balance")
            .eq("user_id", w.user_id)
            .single();

          if (wallet) {
            const refundAmount = w.amount + w.fee_amount;
            await adminClient
              .from("wallets")
              .update({ balance: wallet.balance + refundAmount })
              .eq("id", wallet.id);
          }

          await adminClient
            .from("withdrawals")
            .update({ status: "refunded" })
            .eq("id", w.id);

          await adminClient
            .from("transactions")
            .update({ status: "failed" })
            .eq("user_id", w.user_id)
            .eq("type", "withdrawal")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1);

          await adminClient.rpc("create_notification", {
            p_user_id: w.user_id,
            p_title: "Withdrawal Failed",
            p_message: `Your withdrawal of ₦${Number(w.amount).toLocaleString()} could not be processed. Funds have been refunded.`,
            p_type: "withdrawal",
            p_metadata: { amount: w.amount },
          });

          failed++;
        }
      } catch (err) {
        console.error(`[process-pending-withdrawals] Error processing ${w.id}:`, err);
        // Revert to pending on exception
        await adminClient.from("withdrawals").update({ status: "pending" }).eq("id", w.id);
        failed++;
      }
    }

    console.log(`[process-pending-withdrawals] Done. Processed: ${processed}, Failed: ${failed}`);
    return new Response(
      JSON.stringify({ success: true, processed, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[process-pending-withdrawals] Unhandled error:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
