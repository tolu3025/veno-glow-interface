import { supabase } from "@/integrations/supabase/client";

// NOTE: Map tiles now come from OpenFreeMap (no token required). This module
// only handles directions + privacy helpers used by errand surfaces.

export interface DirectionsResult {
  distance_km: number;
  duration_min: number;
}

/** Try the optional mapbox-proxy edge function; fall back to public OSRM. */
export async function getDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  profile: "driving" | "walking" | "cycling" = "walking"
): Promise<DirectionsResult | null> {
  try {
    const { data } = await supabase.functions.invoke("mapbox-proxy", {
      body: { action: "directions", from, to, profile },
    });
    if (data?.success) {
      return { distance_km: data.distance_km, duration_min: data.duration_min };
    }
  } catch (e) {
    console.warn("[directions] proxy unavailable, trying OSRM", e);
  }

  try {
    const osrmProfile = profile === "walking" ? "foot" : profile === "cycling" ? "bike" : "driving";
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const route = json?.routes?.[0];
      if (route) {
        return {
          distance_km: route.distance / 1000,
          duration_min: route.duration / 60,
        };
      }
    }
  } catch (e) {
    console.warn("[directions] OSRM failed, falling back to haversine", e);
  }

  return null;
}

/**
 * Mask coordinates for privacy by snapping to a ~150m grid.
 * Used to hide exact requester location from runners until acceptance.
 */
export function maskCoord(value: number, precision = 0.0015): number {
  return Math.round(value / precision) * precision;
}
