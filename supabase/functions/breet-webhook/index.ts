// Breet webhook receiver. Verifies x-webhook-secret then delegates to the
// `credit_breet_deposit` RPC for idempotent wallet crediting.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const expected = Deno.env.get("BREET_WEBHOOK_SECRET");
    if (!expected) {
      console.error("[breet-webhook] BREET_WEBHOOK_SECRET not configured");
      return new Response("Server misconfiguration", { status: 500, headers: corsHeaders });
    }
    const provided = req.headers.get("x-webhook-secret");
    if (!provided || provided !== expected) {
      console.error("[breet-webhook] invalid or missing secret");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const payload = await req.json().catch(() => ({} as Record<string, unknown>));
    console.log("[breet-webhook] payload:", JSON.stringify(payload).slice(0, 800));

    // Breet sometimes wraps in { event, data: {...} }
    const root = payload as Record<string, any>;
    const inner = (root.data && typeof root.data === "object") ? root.data : root;
    const event = String(root.event ?? inner.event ?? "");

    // Accept trade.*, deposit.*, OR any payload that carries a status field.
    const hasStatusFallback = typeof inner.status === "string" || typeof root.status === "string";
    if (!/^(trade|deposit)\./i.test(event) && !hasStatusFallback) {
      console.log("[breet-webhook] ignored event with no status:", event);
      return jsonRes({ ignored: true, event });
    }

    const destinationAddress = String(
      inner.destinationAddress ?? inner.depositAddress ?? inner.address ?? root.destinationAddress ?? "",
    );
    const tradeId = String(inner.id ?? inner.tradeId ?? inner.trade_id ?? root.id ?? "");
    if (!destinationAddress || !tradeId) {
      console.error("[breet-webhook] missing destinationAddress/tradeId", { destinationAddress, tradeId, event });
      return jsonRes({ error: "missing fields" });
    }

    const amountUsd = Number(inner.amountInUSD ?? inner.amount_usd ?? inner.usdAmount ?? inner.valueUSD ?? 0);
    const rate = Number(inner.rate ?? inner.exchangeRate ?? inner.rate_ngn ?? 0);
    const grossNgn = amountUsd * rate;
    // 1% service fee
    const ngn = Math.round(grossNgn * 0.99 * 100) / 100;
    const cryptoAmount = Number(inner.cryptoAmount ?? inner.amount ?? inner.amountReceived ?? 0);
    const txHash = String(inner.txHash ?? inner.tx_hash ?? "");
    const confirmations = Number(inner.confirmations ?? 0);
    const status = String(inner.status ?? root.status ?? "");

    const isCompletion = /completed|success|credited/i.test(status) || /\.(completed|success)$/i.test(event);
    console.log("[breet-webhook] parsed", { event, status, amountUsd, rate, ngn, isCompletion });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: rpcData, error: rpcErr } = await admin.rpc("credit_breet_deposit", {
      _trade_id: tradeId,
      _deposit_address: destinationAddress,
      _crypto_amount: cryptoAmount,
      _amount_usd: amountUsd,
      _rate: rate,
      _ngn_amount: ngn,
      _tx_hash: txHash,
      _confirmations: confirmations,
      _event: event,
      _status: status,
      _payload: payload,
    });

    if (rpcErr) {
      console.error("[breet-webhook] rpc error:", rpcErr);
      // Return 5xx so Breet retries — preferable to silently swallowing
      return jsonRes({ success: false, error: rpcErr.message }, 500);
    }

    console.log("[breet-webhook] rpc result:", JSON.stringify(rpcData));

    const creditedStatuses = new Set(["credited"]);
    const wasCredited = rpcData && typeof rpcData === "object" && creditedStatuses.has(String((rpcData as any).status));

    // Send confirmation email only after a successful credit and only once.
    if (wasCredited) {
      try {
        const { data: dep } = await admin
          .from("crypto_deposits")
          .select("user_id, asset_symbol, network, ngn_credited, crypto_amount, tx_hash, email_sent_at")
          .eq("deposit_address", destinationAddress)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (dep?.user_id && !dep.email_sent_at) {
          const { data: u } = await admin.auth.admin.getUserById(dep.user_id);
          const email = u?.user?.email;
          if (email) {
            await sendConversionEmail({
              to: email,
              ngn: Number(dep.ngn_credited ?? ngn),
              cryptoAmount: Number(dep.crypto_amount ?? cryptoAmount),
              assetSymbol: dep.asset_symbol || "",
              network: dep.network || "",
              txHash: String(dep.tx_hash ?? txHash),
            });
            await admin
              .from("crypto_deposits")
              .update({ email_sent_at: new Date().toISOString() })
              .eq("deposit_address", destinationAddress)
              .eq("user_id", dep.user_id);
          }
        }
      } catch (mailErr) {
        console.error("[breet-webhook] email notify failed:", mailErr);
      }
    }

    return jsonRes({ success: true, result: rpcData });
  } catch (e) {
    console.error("[breet-webhook] error:", e);
    return jsonRes({ error: "unexpected" }, 500);
  }
});

// ── Brevo email helper ──────────────────────────────────────────────
const BANNER_URL = "https://app.kukapay.com.ng/email-banner.png";

interface ConversionEmailArgs {
  to: string;
  ngn: number;
  cryptoAmount: number;
  assetSymbol: string;
  network: string;
  txHash: string;
}

function formatNgn(n: number) {
  return new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function renderConversionHtml(a: ConversionEmailArgs) {
  const short = a.txHash ? `${a.txHash.slice(0, 10)}…${a.txHash.slice(-8)}` : "";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Your funds have landed</title></head>
<body style="margin:0;padding:0;background:#eef2fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2fb;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(26,43,107,0.08);">
  <tr><td style="padding:0;line-height:0;font-size:0;">
    <img src="${BANNER_URL}" alt="KukaPay" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
  </td></tr>
  <tr><td style="padding:32px 32px 8px;">
    <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:700;color:#1a2b6b;">Your funds have landed</h1>
    <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#475569;">We received your ${a.cryptoAmount} ${a.assetSymbol} on ${a.network} and credited your KukaPay wallet.</p>
  </td></tr>
  <tr><td style="padding:16px 32px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fbfa;border:1px solid #22b9ad;border-radius:14px;">
      <tr><td style="padding:18px 22px;">
        <div style="font-size:12px;color:#1a2b6b;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Amount credited</div>
        <div style="margin-top:6px;font-size:28px;font-weight:800;color:#22b9ad;">NGN ${formatNgn(a.ngn)}</div>
        <div style="margin-top:6px;font-size:13px;color:#64748b;">${a.cryptoAmount} ${a.assetSymbol} · ${a.network}</div>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 32px 8px;">
    <a href="https://app.kukapay.com.ng/wallet" style="display:inline-block;background:linear-gradient(135deg,#1a2b6b 0%,#5b4ce0 100%);color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:12px;box-shadow:0 4px 14px rgba(34,185,173,0.35);">View in wallet</a>
  </td></tr>
  ${short ? `<tr><td style="padding:8px 32px 24px;"><p style="margin:0;font-size:12px;color:#64748b;">Tx hash: <span style="color:#22b9ad;font-family:'SF Mono',Menlo,monospace;">${short}</span></p></td></tr>` : ""}
  <tr><td style="padding:20px 32px;border-top:2px solid #22b9ad;background:#f7f9ff;">
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">Didn't make this conversion? Contact <a href="mailto:support@kukapay.com.ng" style="color:#22b9ad;text-decoration:none;font-weight:600;">support@kukapay.com.ng</a> immediately.</p>
  </td></tr>
</table>
<p style="margin:16px 0 0;font-size:11px;color:#1a2b6b;font-weight:600;">© KukaPay · Smarter Payments, Greater Possibilities</p>
</td></tr></table></body></html>`;
}

async function sendConversionEmail(a: ConversionEmailArgs) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  if (!LOVABLE_API_KEY || !BREVO_API_KEY) {
    console.error("[breet-webhook] email skipped: LOVABLE_API_KEY or BREVO_API_KEY missing");
    return;
  }
  const res = await fetch("https://connector-gateway.lovable.dev/brevo/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "KukaPay", email: "noreply@app.kukapay.com.ng" },
      to: [{ email: a.to }],
      subject: `Your funds have landed — NGN ${formatNgn(a.ngn)} credited`,
      htmlContent: renderConversionHtml(a),
    }),
  });
  if (!res.ok) {
    console.error("[breet-webhook] brevo send failed", res.status, await res.text());
  }
}
