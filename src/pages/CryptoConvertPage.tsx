import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Copy, Check, Loader2, ChevronRight, Wallet, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { toast } from "@/hooks/use-toast";

interface BreetAsset {
  id: string;
  name: string;
  identifier: string;
  symbol: string;
  icon: string | null;
  network: string;
  minimum: number | null;
  rate_ngn: number | null;
}

interface CryptoDeposit {
  id: string;
  asset_id: string;
  asset_symbol: string;
  asset_name: string;
  asset_identifier: string;
  network: string;
  deposit_address: string;
  minimum_ngn: number | null;
  rate_ngn_at_creation: number | null;
  status: string;
  ngn_credited: number | null;
  crypto_amount: number | null;
  tx_hash: string | null;
  confirmations: number | null;
}

const fmtNgn = (n: number | null | undefined) =>
  n == null ? "—" : "₦" + Number(n).toLocaleString("en-NG", { maximumFractionDigits: 2 });

const fmtUsd = (n: number | null | undefined) =>
  n == null ? "—" : "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

const CryptoConvertPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"asset" | "network" | "deposit">("asset");
  const [assets, setAssets] = useState<BreetAsset[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<BreetAsset | null>(null);
  const [creating, setCreating] = useState(false);
  const [deposit, setDeposit] = useState<CryptoDeposit | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkNow = async () => {
    if (!deposit?.id || checking) return;
    setChecking(true);
    try {
      const data = await friendlyInvoke<{ deposit?: CryptoDeposit; reconciled?: boolean; checked?: number }>(
        "convert-crypto", { body: { action: "reconcile", deposit_id: deposit.id } }
      );
      if (data?.deposit) setDeposit(data.deposit);
      if (!data?.reconciled) {
        toast({
          title: "No deposit detected yet",
          description: data?.checked
            ? "Transfer found but not yet confirmed. We'll keep checking."
            : "If you've already sent it, it can take a few minutes to appear on-chain.",
        });
      }
    } catch (e: any) {
      toast({ title: "Couldn't check right now", description: e.message, variant: "destructive" });
    } finally {
      setTimeout(() => setChecking(false), 5000);
    }
  };

  // Load assets once
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await friendlyInvoke<{ assets: BreetAsset[] }>(
          "convert-crypto", { body: { action: "list-assets" } }, "Could not load assets"
        );
        setAssets(data.assets);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Group by symbol → networks
  const symbolGroups = useMemo(() => {
    const map = new Map<string, BreetAsset[]>();
    for (const a of assets ?? []) {
      const arr = map.get(a.symbol) ?? [];
      arr.push(a);
      map.set(a.symbol, arr);
    }
    return Array.from(map.entries()).map(([symbol, items]) => ({
      symbol,
      name: items[0].name.replace(/\s*(Test|Testnet).*$/i, "").trim(),
      icon: items[0].icon,
      items,
    }));
  }, [assets]);

  const networksForSymbol = useMemo(() => {
    if (!selectedSymbol) return [];
    const g = symbolGroups.find((s) => s.symbol === selectedSymbol);
    return g?.items ?? [];
  }, [selectedSymbol, symbolGroups]);

  const handlePickAsset = (a: BreetAsset) => {
    setSelectedAsset(a);
    void createAddress(a);
  };

  const createAddress = async (a: BreetAsset) => {
    setCreating(true);
    setError(null);
    try {
      const data = await friendlyInvoke<{ deposit: CryptoDeposit }>(
        "convert-crypto",
        { body: { action: "create-address", asset_id: a.id } },
        "Could not generate address"
      );
      setDeposit(data.deposit);
      setStep("deposit");
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Could not generate address", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // Subscribe to status updates on the deposit row
  useEffect(() => {
    if (!deposit?.id) return;
    const channel = supabase
      .channel(`crypto_dep_${deposit.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "crypto_deposits", filter: `id=eq.${deposit.id}` },
        (payload) => {
          const next = payload.new as CryptoDeposit;
          setDeposit((prev) => (prev ? { ...prev, ...next } : next));
          if (next.status === "credited") {
            toast({
              title: "Deposit confirmed",
              description: `${fmtNgn(next.ngn_credited)} credited to your wallet`,
            });
          }
        },
      )
      .subscribe();

    // Reconcile against Breet every 12s as a safety net for missed webhooks
    const interval = setInterval(async () => {
      try {
        const data = await friendlyInvoke<{ deposit?: CryptoDeposit }>(
          "convert-crypto", { body: { action: "reconcile", deposit_id: deposit.id } }
        );
        if (data?.deposit) setDeposit(data.deposit);
      } catch {
        // Silent — next poll retries
      }
    }, 12000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [deposit?.id]);

  const copyAddress = async () => {
    if (!deposit?.deposit_address) return;
    await navigator.clipboard.writeText(deposit.deposit_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] pb-28 md:pb-10 space-y-5 max-w-md mx-auto">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => {
            if (step === "deposit") {
              setDeposit(null);
              setStep("network");
              return;
            }
            if (step === "network") {
              setSelectedSymbol(null);
              setStep("asset");
              return;
            }
            navigate(-1);
          }}
          className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" strokeWidth={1.6} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tightish truncate">Convert Crypto</h1>
          <p className="text-[11px] text-muted-foreground truncate">
            {step === "asset" && "Choose an asset"}
            {step === "network" && `Choose network for ${selectedSymbol}`}
            {step === "deposit" && "Send to the address below"}
          </p>
        </div>
      </div>

      {error && step === "asset" && (
        <div className="rounded-2xl bg-destructive/10 text-destructive text-[12px] p-3">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-3xl bg-card border border-border p-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* STEP 1: ASSET PICKER */}
      {!loading && step === "asset" && (
        <div className="space-y-2">
          {symbolGroups.map((g) => (
            <button
              key={g.symbol}
              onClick={() => {
                setSelectedSymbol(g.symbol);
                if (g.items.length === 1) {
                  handlePickAsset(g.items[0]);
                } else {
                  setStep("network");
                }
              }}
              className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3 hover:bg-muted/50 transition"
            >
              {g.icon ? (
                <img src={g.icon} alt={g.symbol} className="h-9 w-9 rounded-full bg-muted object-contain" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold">{g.symbol}</div>
                <div className="text-[11px] text-muted-foreground">
                  {g.name} · {g.items.length} {g.items.length === 1 ? "network" : "networks"}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          {!loading && symbolGroups.length === 0 && (
            <div className="text-center text-[12px] text-muted-foreground py-8">
              No assets available right now.
            </div>
          )}
        </div>
      )}

      {/* STEP 2: NETWORK PICKER */}
      {step === "network" && (
        <div className="space-y-2">
          {networksForSymbol.map((a) => {
            const groupIcon = symbolGroups.find((g) => g.symbol === a.symbol)?.icon;
            return (
              <button
                key={a.id}
                disabled={creating}
                onClick={() => handlePickAsset(a)}
                className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3 hover:bg-muted/50 transition disabled:opacity-60"
              >
                {groupIcon ? (
                  <img src={groupIcon} alt={a.symbol} className="h-9 w-9 rounded-full bg-muted object-contain" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {a.network.slice(0, 3).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold">{a.network}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Min {fmtUsd(a.minimum)} · Rate {a.rate_ngn ? `₦${a.rate_ngn.toLocaleString()}/1 ${a.symbol}` : "live"}
                  </div>
                </div>
                {creating && selectedAsset?.id === a.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* STEP 3: DEPOSIT */}
      {step === "deposit" && deposit && (
        <div className="space-y-4">
          <StatusBanner deposit={deposit} />

          <div className="rounded-3xl bg-card border border-border p-5 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-muted-foreground">Send</div>
                <div className="text-base font-bold tracking-tightish">
                  {deposit.asset_symbol} · {deposit.network}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-muted-foreground">Min deposit</div>
                <div className="text-sm font-semibold">{fmtUsd(deposit.minimum_ngn)}</div>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-2xl mx-auto w-fit max-w-full">
              <QRCodeSVG value={deposit.deposit_address} size={168} includeMargin={false} className="h-auto w-full max-w-[200px]" />
            </div>

            <div className="rounded-2xl bg-muted p-3 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Deposit address
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-mono break-all flex-1">
                  {deposit.deposit_address}
                </div>
                <button
                  onClick={copyAddress}
                  className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground leading-relaxed">
              Only send <span className="font-semibold text-foreground">{deposit.asset_symbol}</span>{" "}
              on the <span className="font-semibold text-foreground">{deposit.network}</span> network.
              Sending any other asset or using the wrong network will result in loss of funds.
            </div>
          </div>

          {deposit.status !== "credited" && (
            <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] md:static md:bottom-auto z-10">
              <button
                onClick={checkNow}
                disabled={checking}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-60 press-scale shadow-lg md:shadow-none"
              >
                {checking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  "I've sent it — check now"
                )}
              </button>
            </div>
          )}

          <div className="rounded-2xl bg-muted/50 border border-border p-3 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              1% service fee applies. Your wallet is credited automatically in NGN
              once the deposit confirms on-chain.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function StatusBanner({ deposit }: { deposit: CryptoDeposit }) {
  const map: Record<string, { tone: string; label: string; sub: string }> = {
    pending: {
      tone: "bg-muted text-muted-foreground",
      label: "Waiting for deposit",
      sub: "We'll detect your transfer automatically",
    },
    detected: {
      tone: "bg-primary/10 text-primary",
      label: `Detected · ${deposit.confirmations ?? 0} confirmations`,
      sub: "Awaiting full confirmation on-chain",
    },
    credited: {
      tone: "bg-emerald-500/10 text-emerald-600",
      label: `Credited ${fmtNgn(deposit.ngn_credited)}`,
      sub: deposit.crypto_amount
        ? `From ${deposit.crypto_amount} ${deposit.asset_symbol}`
        : "Funds added to your wallet",
    },
    flagged: {
      tone: "bg-amber-500/10 text-amber-600",
      label: "Deposit flagged for review",
      sub: "Below minimum or under manual review",
    },
    failed: {
      tone: "bg-destructive/10 text-destructive",
      label: "Deposit failed",
      sub: "Contact support if funds were sent",
    },
  };
  const s = map[deposit.status] ?? map.pending;
  return (
    <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${s.tone}`}>
      {deposit.status === "credited" ? (
        <Wallet className="h-5 w-5" />
      ) : deposit.status === "pending" ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Coins className="h-5 w-5" />
      )}
      <div className="flex-1">
        <div className="text-[13px] font-semibold">{s.label}</div>
        <div className="text-[11px] opacity-80">{s.sub}</div>
      </div>
    </div>
  );
}

export default CryptoConvertPage;
