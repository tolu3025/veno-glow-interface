import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcryptjs from "https://esm.sh/bcryptjs@2.4.3";
import { listBanksNG, resolveAccount, createDirectTransfer } from "../_shared/flutterwave-v3.ts";
import {
  SQUAD_BANKS, resolveAccount as squadResolveAccount, payoutReference as squadPayoutReference,
  createTransfer as squadCreateTransfer,
} from "../_shared/squad.ts";

// Payout provider switch. Flutterwave stays live until PAYOUT_PROVIDER=squad is set.
const USE_SQUAD = (Deno.env.get("PAYOUT_PROVIDER") || "flutterwave").toLowerCase() === "squad";

/** Squad payout: only an explicit 4xx rejection is "rejected"; anything else is ok/unknown (never refunded). */
async function squadPayout(input: Parameters<typeof squadCreateTransfer>[0]) {
  try {
    const r = await squadCreateTransfer(input);
    if (r.ok) return { status: "ok" as const, raw: r.raw };
    if (r.httpStatus >= 400 && r.httpStatus < 500 && r.httpStatus !== 408 && r.httpStatus !== 429) {
      return { status: "rejected" as const, raw: r.raw };
    }
    return { status: "unknown" as const, raw: r.raw };
  } catch (e) {
    return { status: "unknown" as const, raw: { message: String(e) } };
  }
}
import { amountBlock, detailsTable, formatNaira, renderEmail, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Launch-phase limits (server-enforced)
const MIN_WITHDRAWAL = 1000;
const MAX_WITHDRAWAL = 1000000;

// Student fee schedule (fee on top) — MUST mirror src/lib/fees.ts withdrawalBreakdown.
//   ≤ ₦3,000 → ₦15 flat | ₦3,001–₦9,999 → ₦35 flat
//   ≥ ₦10,000 → 2% + ₦50 stamp duty, total capped at ₦1,500
const STAMP_DUTY = 50;
const STAMP_DUTY_THRESHOLD = 10000;
const MAX_FEE = 1500;
const r2 = (n: number) => Math.round(n * 100) / 100;

function computeFeeBreakdown(amt: number) {
  if (amt <= 0) return { flutterwave: 0, platform: 0, stamp_duty: 0, total_charges: 0, net_payout: 0, total_debit: 0 };
  let transfer: number; let stamp_duty = 0;
  if (amt <= 3000) transfer = 15;
  else if (amt < STAMP_DUTY_THRESHOLD) transfer = 35;
  else {
    transfer = r2(amt * 0.02);
    stamp_duty = STAMP_DUTY;
    if (transfer + stamp_duty > MAX_FEE) transfer = MAX_FEE - stamp_duty;
  }
  const total_charges = r2(transfer + stamp_duty);
  return { flutterwave: transfer, platform: 0, stamp_duty, total_charges, net_payout: amt, total_debit: r2(amt + total_charges) };
}

async function legacySha256(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPin(pin: string, storedHash: string, userId: string, adminClient: any): Promise<boolean> {
  if (storedHash.startsWith("$2")) return await bcryptjs.compare(pin, storedHash);
  const sha256Hash = await legacySha256(pin);
  if (sha256Hash === storedHash) {
    const bcryptHash = await bcryptjs.hash(pin, 10);
    await adminClient.from("profiles").update({ transaction_pin_hash: bcryptHash }).eq("id", userId);
    return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const user = { id: claimsData.claims.sub as string };

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { action } = body;

    // ── GET BANKS ──
    if (action === "get-banks") {
      // Squad has no bank-list API; it uses fixed NIP institution codes.
      const flwBanks = USE_SQUAD ? SQUAD_BANKS : await listBanksNG();
      if (!flwBanks.length) {
        return new Response(JSON.stringify({ success: false, error: "Could not fetch banks" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const logoIndex: Record<string, string> = {};
      const addToIndex = (name: string, code: string | undefined, logo: string) => {
        if (!logo) return;
        if (code) logoIndex[`c:${code}`] ||= logo;
        if (name) logoIndex[`n:${name.toLowerCase().trim()}`] ||= logo;
      };
      try {
        const logoRes = await fetch("https://nigerianbanks.xyz/");
        if (logoRes.ok) {
          const list = (await logoRes.json()) as Array<{ name: string; code: string; logo?: string }>;
          for (const b of list) if (b.logo) addToIndex(b.name, b.code, b.logo);
        }
      } catch { /* non-fatal */ }
      try {
        const MFB_BASE = "https://supermx1.github.io/nigerian-banks-api/";
        const mfbRes = await fetch(`${MFB_BASE}data.json`);
        if (mfbRes.ok) {
          const list = (await mfbRes.json()) as Array<{ name: string; code: string; logo?: string }>;
          for (const b of list) {
            if (!b.logo) continue;
            const url = b.logo.startsWith("http") ? b.logo : `${MFB_BASE}${b.logo}`;
            addToIndex(b.name, b.code, url);
          }
        }
      } catch { /* non-fatal */ }

      const banks = flwBanks.map((b) => {
        const byCode = logoIndex[`c:${b.code}`];
        const byName = logoIndex[`n:${(b.name || "").toLowerCase().trim()}`];
        let loose = "";
        if (!byCode && !byName) {
          const lower = (b.name || "").toLowerCase();
          for (const [k, v] of Object.entries(logoIndex)) {
            if (!k.startsWith("n:")) continue;
            const cand = k.slice(2);
            if (cand && (lower.includes(cand) || cand.includes(lower))) { loose = v; break; }
          }
        }
        return { name: b.name, code: b.code, logo: byCode || byName || loose || null };
      });
      return new Response(JSON.stringify({ success: true, banks }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── RESOLVE ACCOUNT ──
    if (action === "resolve-account") {
      const { account_number, bank_code } = body;
      if (!account_number || !bank_code) {
        return new Response(JSON.stringify({ success: false, error: "Account number and bank code required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const r = USE_SQUAD
        ? await squadResolveAccount(account_number, bank_code)
        : await resolveAccount(account_number, bank_code);
      if (r.ok && r.data?.account_name) {
        return new Response(JSON.stringify({ success: true, account_name: r.data.account_name }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: false, error: r.raw?.message || "Could not resolve account. Please check your details." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    // ── SUBMIT WITHDRAWAL ──
    if (action === "submit-withdrawal") {
      const { bank_code, bank_name, account_number, account_name, amount, pin } = body;

      if (!bank_code || !account_number || !account_name || !amount || !pin) {
        return new Response(JSON.stringify({ success: false, error: "Missing required fields" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt < MIN_WITHDRAWAL) {
        return new Response(JSON.stringify({ success: false, error: `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (amt > MAX_WITHDRAWAL) {
        return new Response(JSON.stringify({ success: false, error: `Maximum withdrawal is ₦${MAX_WITHDRAWAL.toLocaleString()}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check PIN lockout
      const { data: lockStatus } = await adminClient.rpc("check_pin_lockout", { p_user_id: user.id });
      if (lockStatus?.locked) {
        return new Response(JSON.stringify({ success: false, error: lockStatus.message, locked: true }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Verify PIN with bcrypt
      const { data: profile } = await adminClient
        .from("profiles").select("transaction_pin_hash").eq("id", user.id).single();
      if (!profile?.transaction_pin_hash) {
        return new Response(JSON.stringify({ success: false, error: "Transaction PIN not set" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const pinValid = await verifyPin(pin, profile.transaction_pin_hash, user.id, adminClient);
      if (!pinValid) {
        const { data: failResult } = await adminClient.rpc("record_failed_pin", { p_user_id: user.id });
        const msg = failResult?.locked
          ? "Account locked for 30 minutes due to failed PIN attempts."
          : `Incorrect PIN. ${failResult?.remaining || 0} attempts remaining.`;
        return new Response(JSON.stringify({ success: false, error: msg, locked: failResult?.locked }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await adminClient.rpc("reset_pin_attempts", { p_user_id: user.id });

      // KYC tier daily withdrawal limit (mirrors src/lib/kyc-limits.ts)
      const KYC_DAILY: Record<number, number> = { 0: 0, 1: 20000, 2: 150000, 3: 10000000 };
      const { data: kycRow } = await adminClient
        .from("profiles").select("kyc_level").eq("id", user.id).single();
      const tier = Math.min(3, Math.max(0, Number(kycRow?.kyc_level ?? 0)));
      const dailyLimit = KYC_DAILY[tier] ?? 0;
      // Start of today in Lagos (UTC+1)
      const nowLagos = new Date(Date.now() + 3600_000);
      const startUtc = new Date(Date.UTC(nowLagos.getUTCFullYear(), nowLagos.getUTCMonth(), nowLagos.getUTCDate()) - 3600_000);
      const { data: todays } = await adminClient
        .from("withdrawals").select("amount, status")
        .eq("user_id", user.id).gte("created_at", startUtc.toISOString());
      const usedToday = (todays || [])
        .filter((w: any) => !["refunded", "failed", "reversed"].includes(String(w.status)))
        .reduce((s: number, w: any) => s + Number(w.amount || 0), 0);
      if (usedToday + amt > dailyLimit) {
        const left = Math.max(0, dailyLimit - usedToday);
        return new Response(JSON.stringify({
          success: false,
          error: dailyLimit === 0
            ? "Complete your KYC verification to withdraw."
            : `Daily withdrawal limit for your KYC level is ₦${dailyLimit.toLocaleString()}. You can withdraw ₦${left.toLocaleString()} more today.`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check balance
      const { data: walletData } = await adminClient
        .from("wallets").select("id, balance").eq("user_id", user.id).single();
      if (!walletData) {
        return new Response(JSON.stringify({ success: false, error: "Wallet not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Transparent breakdown — same numbers shown to user in the UI.
      const fees = computeFeeBreakdown(amt);
      const fee = fees.total_charges;
      const netPayout = fees.net_payout;
      const totalDeduct = fees.total_debit; // payout + fee, taken from wallet

      if (walletData.balance < totalDeduct) {
        return new Response(JSON.stringify({ success: false, error: `Insufficient balance. You need ₦${totalDeduct.toLocaleString("en-NG")} total (₦${amt.toLocaleString("en-NG")} + ₦${fee.toLocaleString("en-NG")} fee).` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const reference = "WDR-" + crypto.randomUUID();
      // Friendly user-facing reference, e.g. KP-WD-8472
      const friendlyRef = (() => {
        let sum = 0;
        for (let i = 0; i < reference.length; i++) sum = (sum * 31 + reference.charCodeAt(i)) >>> 0;
        return `KP-WD-${(sum % 100000).toString().padStart(4, "0")}`;
      })();

      await adminClient.from("wallets").update({ balance: walletData.balance - totalDeduct }).eq("id", walletData.id);

      const { data: wdRow } = await adminClient.from("withdrawals").insert({
        user_id: user.id, amount: amt, bank_name, account_number, account_name,
        fee_amount: fee, fee_reason: "Transfer fee", is_instant: false, status: "processing",
        reference, debit_mode: "direct", fee_model: "on_top",
      }).select("id").single();
      const wdId = wdRow?.id;

      await adminClient.from("transactions").insert({
        user_id: user.id, type: "withdrawal", amount: totalDeduct,
        fee_amount: fee, fee_reason: "Transfer fee", status: "completed", reference,
        metadata: {
          bank_name, account_number, account_name,
          fee, net_payout: netPayout, total_debit: totalDeduct, fee_model: "on_top", friendly_reference: friendlyRef,
          fees, // { flutterwave, platform, stamp_duty, total_charges, net_payout }
        },
      });

      // Standardized receipt record
      try {
        await adminClient.from("receipts").insert({
          user_id: user.id,
          transaction_reference: reference,
          friendly_reference: friendlyRef,
          type: "withdrawal",
          amount: amt,
          fees,
          metadata: { bank_name, account_number, account_name, net_payout: netPayout, total_debit: totalDeduct, fee_model: "on_top" },
          status: "success",
        });
      } catch (e) {
        console.error("[process-withdrawal] receipt insert failed:", e);
      }

      // Send the payout through the active provider
      try {
        let transferOk = false;
        let transferResult: any = null;
        let providerRef = "";
        if (USE_SQUAD) {
          const squadRef = squadPayoutReference(reference.replace(/[^A-Za-z0-9_-]/g, "_"));
          const out = await squadPayout({
            amount: netPayout, bank_code, account_number, account_name,
            reference: squadRef, remark: `KukaPay Withdrawal ${friendlyRef}`,
          });
          transferResult = out.raw;
          providerRef = `squad:${squadRef}`;
          // Always store our reference before deciding, so reconciliation can requery it.
          await adminClient.from("withdrawals").update({ flutterwave_transfer_ref: providerRef }).eq("id", wdId);
          // Ambiguous (timeout / 5xx / bad response) → never refund; leave processing for requery.
          transferOk = out.status !== "rejected";
        } else {
          const transferResp = await createDirectTransfer({
            amount: netPayout,
            account_number,
            account_bank: bank_code,
            reference,
            narration: `Kuka Pay Withdrawal - ${reference}`,
            beneficiary_name: account_name,
          });
          transferResult = transferResp.raw;
          transferOk = !!(transferResp.ok && transferResp.data?.id
            && !["FAILED", "REJECTED"].includes(String(transferResp.data.status || "").toUpperCase()));
          if (transferOk) providerRef = String(transferResp.data!.id);
        }

        if (transferOk) {
          if (!USE_SQUAD) {
            await adminClient.from("withdrawals")
              .update({ flutterwave_transfer_ref: providerRef })
              .eq("id", wdId);
          }
        } else {
          const reason = transferResult?.message || transferResult?.error?.message || transferResult?.data?.complete_message || "Transfer rejected by provider";
          console.error(`[process-withdrawal] Transfer failed (${reason}):`, JSON.stringify(transferResult));
          // Full refund — restore exact pre-debit balance
          await adminClient.from("wallets").update({ balance: walletData.balance }).eq("id", walletData.id);
          await adminClient.from("withdrawals").update({ status: "refunded" }).eq("id", wdId);
          await adminClient.from("transactions").update({ status: "failed" }).eq("reference", reference);
          await adminClient.rpc("create_notification", {
            p_user_id: user.id,
            p_title: "Withdrawal Failed — Funds Returned",
            p_message: `₦${totalDeduct.toLocaleString("en-NG")} has been returned to your wallet successfully.`,
            p_type: "withdrawal",
            p_metadata: { reference, friendly_reference: friendlyRef, amount: amt, reason },
          });
          try {
            await adminClient.from("receipts").insert({
              user_id: user.id,
              transaction_reference: `${reference}-RV`,
              friendly_reference: friendlyRef.replace("KP-WD", "KP-RV"),
              type: "reversal",
              amount: totalDeduct,
              fees: {},
              metadata: { reason, original_reference: reference, original_friendly: friendlyRef },
              status: "success",
            });
          } catch (e) { console.error("[process-withdrawal] reversal receipt failed:", e); }
          try {
            if (user.email) {
              await sendEmail(
                user.email,
                `Withdrawal not completed — ${formatNaira(totalDeduct)} refunded`,
                renderEmail({
                  title: "Withdrawal refunded",
                  heading: "Withdrawal not completed",
                  intro: "We couldn't complete your withdrawal, so the full amount has been returned to your KukaPay wallet.",
                  body: amountBlock(formatNaira(totalDeduct), "Refunded to your wallet") +
                    `<div style="height:20px;"></div>` +
                    detailsTable([
                      ["Bank", String(bank_name || "—")],
                      ["Amount", formatNaira(amt)],
                      ["Reference", friendlyRef],
                      ["Date", new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })],
                    ]),
                  note: "You can try the withdrawal again at any time.",
                }),
              );
            }
          } catch (e) { console.error("[process-withdrawal] refund email failed:", e); }
          return new Response(JSON.stringify({
            success: false,
            error: "Withdrawal could not be processed. Your funds have been refunded.",
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } catch (e) {
        console.error("[process-withdrawal] Flutterwave transfer error:", e);
        await adminClient.from("wallets").update({ balance: walletData.balance }).eq("id", walletData.id);
        await adminClient.from("withdrawals").update({ status: "refunded" }).eq("id", wdId);
        await adminClient.from("transactions").update({ status: "failed" }).eq("reference", reference);
        await adminClient.rpc("create_notification", {
          p_user_id: user.id,
          p_title: "Withdrawal Failed",
          p_message: `Your withdrawal of ₦${amt.toLocaleString()} could not be processed. ₦${totalDeduct.toLocaleString()} has been refunded.`,
          p_type: "withdrawal",
          p_metadata: { reference, amount: amt },
        });
        try {
          if (user.email) {
            await sendEmail(
              user.email,
              `Withdrawal not completed — ${formatNaira(totalDeduct)} refunded`,
              renderEmail({
                title: "Withdrawal refunded",
                heading: "Withdrawal not completed",
                intro: "We couldn't complete your withdrawal, so the full amount has been returned to your KukaPay wallet.",
                body: amountBlock(formatNaira(totalDeduct), "Refunded to your wallet") +
                  `<div style="height:20px;"></div>` +
                  detailsTable([
                    ["Bank", String(bank_name || "—")],
                    ["Amount", formatNaira(amt)],
                    ["Reference", friendlyRef],
                    ["Date", new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })],
                  ]),
                note: "You can try the withdrawal again at any time.",
              }),
            );
          }
        } catch (mailErr) { console.error("[process-withdrawal] refund email failed:", mailErr); }
        return new Response(JSON.stringify({ success: false, error: "Transfer failed. Your funds have been refunded." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Success notification — friendly, no raw reference codes.
      try {
        await adminClient.rpc("create_notification", {
          p_user_id: user.id,
          p_title: "Withdrawal Successful",
          p_message: `Your withdrawal of ₦${amt.toLocaleString("en-NG")} has been processed successfully.`,
          p_type: "withdrawal",
          p_metadata: {
            reference, friendly_reference: friendlyRef,
            amount: amt, net_payout: netPayout, bank_name,
            account: account_number ? `••••${String(account_number).slice(-4)}` : "",
          },
        });
      } catch (notifyErr) {
        console.error("[process-withdrawal] success notify failed:", notifyErr);
      }

      // Success email receipt
      try {
        if (user.email) {
          const maskedAccount = account_number ? `••••${String(account_number).slice(-4)}` : "—";
          const html = renderEmail({
            title: "Withdrawal successful",
            heading: "Withdrawal successful",
            intro: `Your withdrawal has been processed and sent to your bank account. Here's your receipt.`,
            body: amountBlock(formatNaira(netPayout), "Amount sent to your bank") +
              `<div style="height:20px;"></div>` +
              detailsTable([
                ["Bank", String(bank_name || "—")],
                ["Account", `${account_name || ""} ${maskedAccount}`.trim()],
                ["Bank receives", formatNaira(netPayout)],
                ["Transfer fee", formatNaira(fees?.total_charges ?? 0)],
                ["Total from wallet", formatNaira(totalDeduct)],
                ["Reference", friendlyRef],
                ["Date", new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })],
              ]),
            note: "Bank settlement is usually instant but can take a few minutes during peak periods.",
            footer: `Didn't make this withdrawal? Contact <a href="mailto:support@kukapay.com.ng" style="color:#22b9ad;text-decoration:none;font-weight:600;">support@kukapay.com.ng</a> or WhatsApp 08148698365 immediately.`,
          });
          await sendEmail(user.email, `Withdrawal successful — ${formatNaira(netPayout)} sent`, html);
        }
      } catch (mailErr) {
        console.error("[process-withdrawal] success email failed:", mailErr);
      }

      return new Response(JSON.stringify({
        success: true, reference, friendly_reference: friendlyRef,
        amount: amt, net_payout: netPayout, total_deducted: totalDeduct,
        fees,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: false, error: "Unknown action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[process-withdrawal] Unhandled error:", e);
    return new Response(JSON.stringify({ success: false, error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
