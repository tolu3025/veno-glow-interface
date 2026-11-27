import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Vault, ArrowRightLeft, Lock, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUsdWallet } from "@/hooks/useUsdWallet";
import { useLiveFxRate } from "@/hooks/useLiveFxRate";
import { LockCountdown } from "@/components/vault/LockCountdown";
import { VaultOnboarding } from "@/components/vault/VaultOnboarding";
import { fmtUSD, fmtNGN } from "@/lib/vaultChallenges";

export default function DollarVaultPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { wallet, locks, loading } = useUsdWallet();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { rate } = useLiveFxRate();

  useEffect(() => {
    if (!localStorage.getItem("kuka_vault_onboarded_v1")) setShowOnboarding(true);
  }, []);

  const tier3 = (profile?.kyc_level ?? 0) >= 3;
  const available = Number(wallet?.available_usd ?? 0);
  const locked = Number(wallet?.locked_usd ?? 0);
  const total = available + locked;
  const activeLocks = locks.filter((l) => l.status === "active");
  const matured = locks.filter((l) => l.status === "matured");

  if (showOnboarding) return <VaultOnboarding onDone={() => setShowOnboarding(false)} />;

  return (
    <div className="pb-28">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate("/")} className="h-9 w-9 -ml-2 flex items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold tracking-tightish flex items-center gap-2">
            Dollar Vault <span className="text-xs bg-accent/15 text-accent font-bold px-2 py-0.5 rounded-full uppercase">New</span>
          </h1>
          <p className="text-xs text-muted-foreground">Save in dollars. Beat Naira drop.</p>
        </div>
      </header>

      {/* Vault balance hero */}
      <div className="mx-5 rounded-[28px] p-6 text-white shadow-soft-lg overflow-hidden relative"
           style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d5f8b 50%, #4a90c2 100%)" }}>
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute top-16 -right-4 h-16 w-16 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
            <Vault className="h-4 w-4" /> Total in vault
          </div>
          <div className="text-5xl font-bold mt-3 tracking-tight">
            {loading ? "•••" : fmtUSD(total)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider opacity-70">Available</div>
              <div className="text-lg font-bold mt-1">{fmtUSD(available)}</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider opacity-70">Locked</div>
              <div className="text-lg font-bold mt-1">{fmtUSD(locked)}</div>
            </div>
          </div>
          {rate && (
            <div className="mt-4 text-xs opacity-80">
              $1 ≈ {fmtNGN(rate)} today · Est. value: {fmtNGN(total * rate)}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        <Button size="lg" className="h-14 rounded-2xl" onClick={() => navigate("/vault/convert")}>
          <ArrowRightLeft className="mr-2 h-5 w-5" /> Convert
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="h-14 rounded-2xl"
          disabled={!tier3 || available < 1}
          onClick={() => navigate("/vault/lock/select")}
        >
          <Lock className="mr-2 h-5 w-5" /> Lock
        </Button>
      </div>

      {!tier3 && (
        <div className="mx-5 mt-3 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            Locking savings requires <b>Level 3 KYC (BVN)</b>. You can still convert Naira ↔ Dollar instantly.{" "}
            <button className="underline font-semibold" onClick={() => navigate("/kyc")}>Upgrade →</button>
          </div>
        </div>
      )}

      {/* Active locks */}
      {activeLocks.length > 0 && (
        <section className="px-5 mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Active challenges</h2>
          <div className="space-y-3">
            {activeLocks.map((l) => (
              <button
                key={l.id}
                onClick={() => navigate(`/vault/lock/${l.id}`)}
                className="w-full text-left rounded-2xl bg-card border border-border p-4 press-scale"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">{l.challenge_name}</div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-primary">{fmtUSD(Number(l.principal_usd))}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Unlocks in <LockCountdown matureAt={l.mature_at} compact />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Matured — nudge */}
      {matured.length > 0 && (
        <section className="px-5 mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Completed 🎉</h2>
          <div className="space-y-2">
            {matured.slice(0, 3).map((l) => (
              <button
                key={l.id}
                onClick={() => navigate(`/vault/celebrate/${l.id}`)}
                className="w-full text-left rounded-2xl bg-accent/10 border border-accent/20 p-3 flex items-center gap-3"
              >
                <div className="text-2xl">🏆</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{l.challenge_name}</div>
                  <div className="text-xs text-muted-foreground">{fmtUSD(Number(l.principal_usd))} released</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && activeLocks.length === 0 && matured.length === 0 && (
        <div className="mx-5 mt-8 rounded-3xl bg-muted/50 p-8 text-center">
          <div className="text-5xl mb-3">🏦</div>
          <h3 className="font-bold text-lg">Your vault is empty</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Convert some Naira to dollars, then pick a Savings Challenge to lock them away.
          </p>
          <Button onClick={() => navigate("/vault/convert")} className="rounded-full">
            Convert first dollars →
          </Button>
        </div>
      )}
    </div>
  );
}
