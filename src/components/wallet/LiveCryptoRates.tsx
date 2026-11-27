import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { friendlyInvoke } from "@/lib/friendlyInvoke";

interface Asset {
  id?: string;
  name: string;
  symbol: string;
  icon?: string | null;
  rate_ngn: number | null;
}

const CACHE_KEY = "kp.crypto.rates.v1";
const FRESH_MS = 120_000; // consider cache fresh for 2 minutes
const TIMEOUT_MS = 8_000; // give up on a slow API and fall back to cache

interface CachedRates {
  assets: Asset[];
  at: number;
}

const readCache = (): CachedRates | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRates;
    if (!Array.isArray(parsed?.assets) || !parsed.assets.length) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (assets: Asset[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ assets, at: Date.now() } satisfies CachedRates));
  } catch {
    /* storage full / disabled — caching is best-effort */
  }
};

/** One row per coin: dedupe multi-network listings (e.g. USDT on TRC20/ERC20/BEP20). */
const dedupeBySymbol = (list: Asset[]) => {
  const bySymbol = new Map<string, Asset>();
  for (const a of list) {
    const key = (a.symbol || a.name || "").toUpperCase();
    if (!key) continue;
    const existing = bySymbol.get(key);
    if (!existing || Number(a.rate_ngn) > Number(existing.rate_ngn)) bySymbol.set(key, a);
  }
  return Array.from(bySymbol.values());
};

const fmt = (n: number) =>
  n >= 1000
    ? `₦${Math.round(n).toLocaleString("en-NG")}`
    : `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

const timeAgo = (d: Date) => {
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
};

export const LiveCryptoRates = () => {
  const navigate = useNavigate();
  const cached = useRef(readCache()).current;
  const [assets, setAssets] = useState<Asset[] | null>(cached?.assets ?? null);
  const [stale, setStale] = useState(Boolean(cached));
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(cached ? new Date(cached.at) : null);

  const load = useCallback(async (force = false) => {
    const c = readCache();
    if (!force && c && Date.now() - c.at < FRESH_MS) {
      setAssets(c.assets);
      setUpdatedAt(new Date(c.at));
      setStale(false);
      return;
    }

    setRefreshing(true);
    try {
      const res = await Promise.race([
        friendlyInvoke<{ assets: Asset[] }>(
          "convert-crypto",
          { body: { action: "list-assets" } },
          "Could not load live rates",
        ),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
      ]);

      const list = dedupeBySymbol((res?.assets ?? []).filter((a) => a.rate_ngn && a.rate_ngn > 0)).slice(0, 6);
      if (!list.length) throw new Error("empty");

      setAssets(list);
      writeCache(list);
      setUpdatedAt(new Date());
      setStale(false);
      setError(false);
    } catch {
      // Graceful fallback: keep showing the last known rates, clearly marked as cached.
      const fallback = readCache();
      if (fallback) {
        setAssets(fallback.assets);
        setUpdatedAt(new Date(fallback.at));
        setStale(true);
        setError(false);
      } else {
        setAssets([]);
        setError(true);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), FRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tightish flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-accent" strokeWidth={1.8} /> Live crypto rates
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {updatedAt
              ? stale
                ? `Showing last known rates · ${timeAgo(updatedAt)}`
                : `Updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Fetching live prices…"}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          aria-label="Refresh rates"
          className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center press-scale"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} strokeWidth={1.7} />
        </button>
      </div>

      {assets === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-6 text-center text-[13px] text-muted-foreground">
          {error ? "Live rates unavailable right now" : "No assets available"}
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
          {assets.map((a) => (
            <button
              key={a.symbol}
              onClick={() => navigate("/wallet/convert-crypto")}
              className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-muted/40 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-accent/10 text-accent flex items-center justify-center overflow-hidden">
                {a.icon ? (
                  <img src={a.icon} alt={`${a.name} logo`} className="h-6 w-6 object-contain" loading="lazy" />
                ) : (
                  <span className="text-[11px] font-bold">{a.symbol.slice(0, 3)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold truncate">{a.name}</p>
                <p className="text-[11px] text-muted-foreground uppercase">{a.symbol}</p>
              </div>
              <p className="font-mono-num text-[14px] font-bold">{fmt(Number(a.rate_ngn))}</p>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate("/wallet/convert-crypto")}
        className="w-full h-11 rounded-2xl bg-accent/10 text-accent text-[13px] font-semibold flex items-center justify-center gap-1.5 press-scale"
      >
        Convert crypto to Naira <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </section>
  );
};

export default LiveCryptoRates;
