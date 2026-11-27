import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NETWORK_CODE: Record<string, string> = {
  mtn: "01",
  glo: "02",
  "9mobile": "03",
  airtel: "04",
};

// V1 listing uses these MOBILE_NETWORK keys
const NETWORK_API_KEY: Record<string, string> = {
  mtn: "MTN",
  glo: "Glo",
  airtel: "Airtel",
  "9mobile": "m_9mobile",
};

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const userId = Deno.env.get("CLUBKONNECT_USER_ID");
    const apiKey = Deno.env.get("CLUBKONNECT_API_KEY");
    if (!userId || !apiKey) {
      return jsonRes({ success: false, error: "Service unavailable" }, 503);
    }

    const { network } = await req.json();
    if (!network || !NETWORK_CODE[network]) {
      return jsonRes({ success: false, error: "Invalid network" }, 400);
    }

    // V1 listing — its PRODUCT_ID values are what CK's V1 purchase endpoint accepts
    // as the DataPlan parameter. PRODUCT_CODE does NOT work for purchase.
    const url = `https://www.nellobytesystems.com/APIDatabundlePlans.asp?UserID=${encodeURIComponent(userId)}&APIKey=${encodeURIComponent(apiKey)}`;
    console.log(`[get-clubkonnect-data-plans] Fetching plans for ${network}`);

    const res = await fetch(url);
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch {
      console.error("[get-clubkonnect-data-plans] Invalid JSON:", text.slice(0, 300));
      return jsonRes({ success: false, error: "Failed to load plans" }, 502);
    }

    const networks = data?.MOBILE_NETWORK ?? {};
    const networkBlock = networks[NETWORK_API_KEY[network]] ?? null;

    const rawPlans: any[] = [];
    if (Array.isArray(networkBlock)) {
      for (const entry of networkBlock) {
        if (Array.isArray(entry?.PRODUCT)) rawPlans.push(...entry.PRODUCT);
      }
    }

    // Use PRODUCT_ID as plan_id — this is the value CK V1 purchase accepts.
    // Dedupe by PRODUCT_ID within the network (CK occasionally lists duplicates).
    const seen = new Set<string>();
    const plans = rawPlans
      .map((p) => ({
        plan_id: String(p.PRODUCT_ID ?? ""),
        name: String(p.PRODUCT_NAME ?? "Data Plan"),
        price: Number(p.PRODUCT_AMOUNT ?? 0),
        validity: "",
      }))
      .filter((p) => {
        if (!p.plan_id || p.price <= 0) return false;
        if (seen.has(p.plan_id)) return false;
        seen.add(p.plan_id);
        return true;
      })
      .sort((a, b) => a.price - b.price);

    console.log(`[get-clubkonnect-data-plans] ${network}: ${plans.length} plans`);

    return jsonRes({ success: true, plans, network_code: NETWORK_CODE[network] });
  } catch (err) {
    console.error("[get-clubkonnect-data-plans] Error:", err);
    return jsonRes({ success: false, error: "Unexpected error" }, 500);
  }
});
