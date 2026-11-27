import { useEffect, useState, useCallback } from "react";
import { friendlyInvoke } from "@/lib/friendlyInvoke";

// Live NGN-per-1-USD mid rate via existing fx-quote edge function
// (backed by Flutterwave v3 /transfers/rates with fallback).
// Cached in module scope for 60 seconds so multiple mounts share one call.
let cache: { rate: number; at: number } | null = null;
const TTL_MS = 60_000;

export function useLiveFxRate() {
  const [rate, setRate] = useState<number | null>(() =>
    cache && Date.now() - cache.at < TTL_MS ? cache.rate : null
  );
  const [loading, setLoading] = useState(!rate);

  const load = useCallback(async () => {
    if (cache && Date.now() - cache.at < TTL_MS) {
      setRate(cache.rate);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Small NGN→USD probe just to read the current mid rate.
      const q = await friendlyInvoke<{ rate: number; mid_rate?: number }>("fx-quote", {
        body: { direction: "ngn_to_usd", ngn_amount: 100000 },
      });
      const live = q?.mid_rate && q.mid_rate > 0 ? q.mid_rate : q?.rate;
      if (live && live > 0) {
        cache = { rate: live, at: Date.now() };
        setRate(live);
      }
    } catch {
      // silent — callers show em-dash when null
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  return { rate, loading, refresh: load };
}
