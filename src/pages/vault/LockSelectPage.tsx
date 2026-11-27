import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useUsdWallet } from "@/hooks/useUsdWallet";
import { CHALLENGES, fmtUSD, type LockDays } from "@/lib/vaultChallenges";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function LockSelectPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { justConverted?: number } };
  const { profile } = useAuth();
  const { wallet, refresh } = useUsdWallet();
  const [amount, setAmount] = useState(location.state?.justConverted?.toString() ?? "");
  const [days, setDays] = useState<LockDays>(30);
  const [loading, setLoading] = useState(false);

  const available = Number(wallet?.available_usd ?? 0);
  const tier3 = (profile?.kyc_level ?? 0) >= 3;

  if (!tier3) {
    return (
      <div className="px-5 pt-12 pb-28">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="h-9 w-9 -ml-2 flex items-center justify-center rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[22px] font-bold">Savings Challenges</h1>
        </header>
        <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6 text-center">
          <div className="text-5xl mb-3">🛡️</div>
          <h3 className="font-bold text-lg">Verify your BVN to unlock this</h3>
          <p className="text-sm text-amber-900/80 mt-1 mb-4">
            Locking savings is a Tier 3 feature. It takes 2 minutes to add your BVN.
          </p>
          <Button onClick={() => navigate("/kyc")} className="rounded-full">Complete Level 3 KYC</Button>
        </div>
      </div>
    );
  }

  const submit = async () => {
    const n = Number(amount);
    if (!n || n <= 0) return toast({ title: "Enter amount to lock", variant: "destructive" });
    if (n > available) return toast({ title: "Not enough available USD", variant: "destructive" });
    setLoading(true);
    try {
      const r = await friendlyInvoke<any>("dollar-lock-create", { body: { usd_amount: n, lock_days: days } });
      await refresh();
      navigate(`/vault/lock/${r.lock_id}`, { state: { justCreated: true } });
    } catch (e: any) {
      toast({ title: e.message || "Could not create lock", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="px-5 pt-12 pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="h-9 w-9 -ml-2 flex items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[22px] font-bold tracking-tightish">Pick a Challenge</h1>
          <p className="text-xs text-muted-foreground">Available: {fmtUSD(available)}</p>
        </div>
      </header>

      {/* Amount */}
      <div className="rounded-2xl bg-card border border-border p-4 mb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Amount to lock</div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">💵</span>
          <Input
            type="number" inputMode="decimal" placeholder="0" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border-0 shadow-none text-3xl font-bold h-14 p-0 focus-visible:ring-0 tabular-nums"
          />
          <span className="font-bold text-muted-foreground">USD</span>
        </div>
        <div className="flex gap-2 mt-2">
          {[0.25, 0.5, 1].map((p) => (
            <button key={p} onClick={() => setAmount((available * p).toFixed(2))}
              className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/70">
              {p === 1 ? "Max" : `${p * 100}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges */}
      <div className="space-y-3">
        {CHALLENGES.map((c) => (
          <button
            key={c.days}
            onClick={() => setDays(c.days)}
            className={cn(
              "w-full text-left rounded-2xl p-4 border-2 transition-all press-scale",
              days === c.days ? "border-primary bg-primary/5" : "border-transparent bg-card"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-3xl", c.vibe)}>
                {c.emoji}
              </div>
              <div className="flex-1">
                <div className="font-bold">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.tagline}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Lock for</div>
                <div className="font-bold text-primary">{c.days}d</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground">
        <b>Early unlock:</b> 2% of your dollar principal OR ₦500 (whichever is more) is deducted. No penalty if you wait for maturity.
      </div>

      <Button
        size="lg" className="w-full h-14 rounded-2xl mt-6" disabled={loading || !amount}
        onClick={submit}
      >
        <Lock className="mr-2 h-5 w-5" />
        {loading ? "Locking..." : `Lock ${amount ? fmtUSD(Number(amount)) : ""} for ${days} days`}
      </Button>
    </div>
  );
}
