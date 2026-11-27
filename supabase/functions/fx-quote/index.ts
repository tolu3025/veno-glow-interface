// Dollar Vault: create a short-lived NGN↔USD quote (60s validity)
// Uses a live public FX source + 1.5% spread to hedge. Swap in Flutterwave
// FX Quotes API later without changing the client contract.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SPREAD = 0.015; // 1.5%
const MIN_NGN = 1000;
const MIN_USD = 1;
const QUOTE_TTL_SECONDS = 60;

const Body = z.object({
  direction: z.enum(["ngn_to_usd", "usd_to_ngn"]),
  ngn_amount: z.number().positive().optional(),
  usd_amount: z.number().positive().optional(),
});

async function fetchMidRate(direction: "ngn_to_usd" | "usd_to_ngn"): Promise<number> {
  // 1) Primary: exchangerate-api.com (live NGN per 1 USD)
  const erApiKey = Deno.env.get("EXCHANGERATE_API_KEY");
  if (erApiKey) {
    try {
      const r = await fetch(`https://v6.exchangerate-api.com/v6/${erApiKey}/latest/USD`);
      const j = await r.json();
      const ngn = Number(j?.conversion_rates?.NGN);
      if (ngn && ngn > 100) return ngn;
    } catch (e) {
      console.warn("[fx-quote] exchangerate-api failed", e);
    }
  }
  // 2) Fallback: Flutterwave v3 FX rates
  try {
    const { getFxRate } = await import("../_shared/flutterwave-v3.ts");
    const from = direction === "ngn_to_usd" ? "NGN" : "USD";
    const to   = direction === "ngn_to_usd" ? "USD" : "NGN";
    const rate = await getFxRate(from, to, 100);
    if (rate) {
      // Normalize to NGN-per-USD
      return direction === "ngn_to_usd" ? 1 / rate : rate;
    }
  } catch (e) {
    console.warn("[fx-quote] flutterwave v4 rates failed", e);
  }
  // 3) Last resort: public open API
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    const j = await r.json();
    const ngn = Number(j?.rates?.NGN);
    if (ngn && ngn > 100) return ngn;
  } catch (e) {
    console.warn("[fx-quote] fallback rate failed", e);
  }
  return Number(Deno.env.get("FLUTTERWAVE_FX_MID_RATE") ?? "1550");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }
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
    const { direction, ngn_amount, usd_amount } = parsed.data;

    const mid = await fetchMidRate(direction);
    // Buy rate (student buys USD with NGN): higher NGN per USD
    // Sell rate (student sells USD for NGN): lower NGN per USD
    const rate = direction === "ngn_to_usd" ? mid * (1 + SPREAD) : mid * (1 - SPREAD);

    let ngn: number, usd: number;
    if (direction === "ngn_to_usd") {
      if (!ngn_amount) return json({ success: false, error: "ngn_amount required" }, 400);
      if (ngn_amount < MIN_NGN) return json({ success: false, error: `Minimum ₦${MIN_NGN}` }, 400);
      ngn = Math.round(ngn_amount * 100) / 100;
      usd = Math.round((ngn / rate) * 10000) / 10000;
    } else {
      if (!usd_amount) return json({ success: false, error: "usd_amount required" }, 400);
      if (usd_amount < MIN_USD) return json({ success: false, error: `Minimum $${MIN_USD}` }, 400);
      usd = Math.round(usd_amount * 10000) / 10000;
      ngn = Math.round(usd * rate * 100) / 100;
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const expiresAt = new Date(Date.now() + QUOTE_TTL_SECONDS * 1000).toISOString();
    const { data: quote, error } = await admin.from("fx_quotes").insert({
      user_id: userId, direction, rate, ngn_amount: ngn, usd_amount: usd,
      status: "pending", expires_at: expiresAt,
    }).select("id, rate, ngn_amount, usd_amount, expires_at").single();
    if (error) throw error;

    return json({
      success: true,
      quote_id: quote.id,
      rate: quote.rate,
      ngn_amount: quote.ngn_amount,
      usd_amount: quote.usd_amount,
      expires_at: quote.expires_at,
      mid_rate: mid,
      spread_pct: SPREAD * 100,
    });
  } catch (e) {
    console.error("[fx-quote]", e);
    return json({ success: false, error: "Internal error" }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
