import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { createDirectTransfer } from "../_shared/flutterwave-v3.ts";
import { checkAdaptiveLimit, limitResponse } from "../_shared/adaptive-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
};

const Body = z.object({
  amount: z.number().positive(),
  bank_account: z.string().min(6).max(20),
  bank_code: z.string().min(2).max(10),
  account_name: z.string().min(2).max(120).optional(),
  idempotency_key: z.string().min(8).max(80).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ success: false, error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { amount, bank_account, bank_code, account_name, idempotency_key } = parsed.data;

    const reference = idempotency_key
      ? `KUKA-WD-${idempotency_key}`
      : `KUKA-WD-${userId.slice(0, 8)}-${Date.now()}`;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const limit = await checkAdaptiveLimit(admin, req, "withdrawal", 12, 60);
    if (!limit.allowed) return limitResponse(limit, corsHeaders);

    // Idempotent: return existing tx if reference already used
    const { data: existing } = await admin.from("transactions").select("status, reference")
      .eq("reference", reference).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ success: true, status: existing.status, reference, idempotent: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: rpcData, error: rpcErr } = await admin.rpc("safe_withdrawal", {
      _user_id: userId, _amount: amount, _reference: reference,
      _bank_account: bank_account, _bank_code: bank_code,
    });
    if (rpcErr) {
      console.error("safe_withdrawal error", rpcErr);
      return new Response(JSON.stringify({ success: false, error: rpcErr.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if ((rpcData as any)?.status !== "pending") {
      return new Response(JSON.stringify({ success: false, ...(rpcData as any) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Call Flutterwave v3 direct transfer
    const transferResp = await createDirectTransfer({
      amount,
      account_number: bank_account,
      account_bank: bank_code,
      reference,
      narration: "KukaPay withdrawal",
      beneficiary_name: account_name || "KukaPay user",
    });
    const transferData: any = transferResp.raw;
    const transferOk = transferResp.ok && transferResp.data?.id
      && !["FAILED", "REJECTED"].includes(String(transferResp.data.status || "").toUpperCase());

    if (!transferOk) {
      // Refund: release hold back to available
      await admin.from("transactions").update({ status: "failed" }).eq("reference", reference);
      const { data: w } = await admin.from("wallets").select("id, available_balance, hold_balance").eq("user_id", userId).maybeSingle();
      if (w) {
        await admin.from("wallets").update({
          available_balance: Number(w.available_balance) + amount,
          hold_balance: Math.max(0, Number(w.hold_balance) - amount),
        }).eq("id", w.id);
      }
      return new Response(JSON.stringify({ success: false, error: transferData?.message || transferData?.error?.message || "Transfer failed", reference }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("transactions").update({
      status: "completed",
      metadata: { provider: "flutterwave", bank_account, bank_code, transfer_id: transferResp.data!.id },
    }).eq("reference", reference);
    await admin.rpc("finalize_withdrawal", { _user_id: userId, _amount: amount });


    return new Response(JSON.stringify({ success: true, status: "completed", reference }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("initiate-withdrawal", e);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
