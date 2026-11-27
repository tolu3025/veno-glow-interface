import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLW_BASE = "https://api.flutterwave.com/v3";

const BILLER_CODES: Record<string, string> = {
  mtn: "BIL108",
  glo: "BIL109",
  airtel: "BIL110",
  "9mobile": "BIL111",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const flwKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flwKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Service unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { network } = await req.json();
    const billerCode = BILLER_CODES[network];
    if (!billerCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid network" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[get-data-plans] Fetching bill-categories for ${network} (${billerCode})`);

    const res = await fetch(`${FLW_BASE}/bill-categories?biller_code=${billerCode}`, {
      headers: { Authorization: `Bearer ${flwKey}` },
    });

    const data = await res.json();
    console.log(`[get-data-plans] Response status: ${res.status}, count: ${data.data?.length ?? 0}`);

    if (data.status !== "success" || !data.data?.length) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch data plans" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log first item's raw fields to debug name vs biller_name
    if (data.data[0]) {
      const sample = data.data[0];
      console.log(`[get-data-plans] Sample item keys: ${Object.keys(sample).join(", ")}`);
      console.log(`[get-data-plans] Sample: name="${sample.name}", biller_name="${sample.biller_name}", short_name="${sample.short_name}", biller_code="${sample.biller_code}", item_code="${sample.item_code}"`);
    }

    // Flutterwave docs say: use the "name" field value as the "type" in /v3/bills
    const plans = data.data
      .filter((p: any) => !p.is_airtime)
      .map((p: any) => ({
        // IMPORTANT: Use p.name (not p.biller_name) as Flutterwave bills API expects the "name" field
        name: p.name,
        biller_name: p.biller_name,
        label: (p.short_name || p.name || "").replace(/^(MTN|GLO|AIRTEL|9MOBILE|ETISALAT)\s*/i, "").trim(),
        amount: p.amount,
        fee: p.fee || 0,
        item_code: p.item_code || null,
        biller_code: billerCode,
      }))
      .filter((p: any) => p.amount > 0)
      .sort((a: any, b: any) => a.amount - b.amount);

    return new Response(
      JSON.stringify({ success: true, plans, biller_code: billerCode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[get-data-plans] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
