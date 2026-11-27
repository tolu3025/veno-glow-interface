import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonRes(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const publicToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");
  const secretToken = Deno.env.get("MAPBOX_ACCESS_TOKEN");
  // Server-side API calls prefer secret token; fall back to public if that's all we have
  const token = secretToken || publicToken;
  if (!token) return jsonRes({ success: false, error: "Mapbox token not configured" }, 500);

  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // Return PUBLIC token (pk.*) for client-side Mapbox GL rendering.
    // Never return a secret token (sk.*) here — Mapbox GL rejects it.
    if (action === "get_token") {
      const clientToken = publicToken || (secretToken && secretToken.startsWith("pk.") ? secretToken : null);
      if (!clientToken) {
        return jsonRes({ success: false, error: "MAPBOX_PUBLIC_TOKEN not configured. Add a pk.* token in Supabase secrets." }, 500);
      }
      return jsonRes({ success: true, token: clientToken });
    }

    // Directions API: returns distance (m) and duration (s) between coordinates
    if (action === "directions") {
      const { from, to, profile } = body as {
        from: { lat: number; lng: number };
        to: { lat: number; lng: number };
        profile?: string;
      };
      if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) {
        return jsonRes({ success: false, error: "Missing from/to coordinates" }, 400);
      }
      const prof = profile === "walking" || profile === "cycling" || profile === "driving" ? profile : "driving";
      const url = `https://api.mapbox.com/directions/v5/mapbox/${prof}/${from.lng},${from.lat};${to.lng},${to.lat}?access_token=${token}&overview=false`;

      const r = await fetch(url);
      if (!r.ok) {
        const txt = await r.text();
        console.error("[mapbox-proxy] Directions error:", r.status, txt);
        return jsonRes({ success: false, error: "Directions API failed" }, 502);
      }
      const data = await r.json();
      const route = data.routes?.[0];
      if (!route) return jsonRes({ success: false, error: "No route found" });

      return jsonRes({
        success: true,
        distance_m: route.distance,
        duration_s: route.duration,
        distance_km: +(route.distance / 1000).toFixed(2),
        duration_min: Math.ceil(route.duration / 60),
      });
    }

    // Matrix API: returns walking/driving distance + duration from one origin to many destinations
    if (action === "matrix") {
      const { origin, destinations, profile } = body as {
        origin: { lat: number; lng: number };
        destinations: Array<{ lat: number; lng: number }>;
        profile?: string;
      };
      if (!origin?.lat || !origin?.lng || !Array.isArray(destinations) || destinations.length === 0) {
        return jsonRes({ success: false, error: "Missing origin or destinations" }, 400);
      }
      // Mapbox Matrix API allows max 25 coordinates total (origin + destinations)
      const dests = destinations.slice(0, 24);
      const prof = profile === "walking" || profile === "cycling" || profile === "driving" ? profile : "walking";

      // Haversine fallback (meters) + walking-speed estimate (1.4 m/s)
      const haversine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
        const R = 6371000;
        const toRad = (x: number) => (x * Math.PI) / 180;
        const dLat = toRad(b.lat - a.lat);
        const dLng = toRad(b.lng - a.lng);
        const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(s));
      };
      const speedMps = prof === "driving" ? 11 : prof === "cycling" ? 4.5 : 1.4;
      const fallbackResults = () => dests.map((d) => {
        const m = haversine(origin, d);
        const s = m / speedMps;
        return {
          distance_m: m,
          duration_s: s,
          distance_km: +(m / 1000).toFixed(2),
          duration_min: Math.ceil(s / 60),
        };
      });

      // Matrix API requires >=2 elements; with 1 source + 1 dest = 1 element → use haversine
      if (dests.length < 2) {
        return jsonRes({ success: true, results: fallbackResults(), fallback: true });
      }

      const coords = [`${origin.lng},${origin.lat}`, ...dests.map((d) => `${d.lng},${d.lat}`)].join(";");
      const destIdx = dests.map((_, i) => i + 1).join(";");
      const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/${prof}/${coords}?sources=0&destinations=${destIdx}&annotations=distance,duration&access_token=${token}`;

      const r = await fetch(url);
      if (!r.ok) {
        const txt = await r.text();
        console.error("[mapbox-proxy] Matrix error:", r.status, txt);
        return jsonRes({ success: true, results: fallbackResults(), fallback: true, warning: "matrix_unavailable" });
      }
      const data = await r.json();
      const distances: Array<number | null> = data.distances?.[0] ?? [];
      const durations: Array<number | null> = data.durations?.[0] ?? [];

      return jsonRes({
        success: true,
        results: dests.map((_, i) => ({
          distance_m: distances[i] ?? null,
          duration_s: durations[i] ?? null,
          distance_km: distances[i] != null ? +(distances[i]! / 1000).toFixed(2) : null,
          duration_min: durations[i] != null ? Math.ceil(durations[i]! / 60) : null,
        })),
      });
    }

    return jsonRes({ success: false, error: "Unknown action" }, 400);
  } catch (err) {
    console.error("[mapbox-proxy] Unhandled:", err);
    return jsonRes({ success: false, error: "Unexpected error" }, 500);
  }
});
