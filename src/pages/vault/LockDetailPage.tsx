import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Vault, Lock as LockIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LockCountdown } from "@/components/vault/LockCountdown";
import { challengeFor, fmtUSD, fmtNGN } from "@/lib/vaultChallenges";
import { useLiveFxRate } from "@/hooks/useLiveFxRate";
import type { DollarLock } from "@/hooks/useUsdWallet";
import { ConfettiBurst } from "@/components/shared/ConfettiBurst";

export default function LockDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation() as { state?: { justCreated?: boolean } };
  const [lock, setLock] = useState<DollarLock | null>(null);
  const { rate } = useLiveFxRate();
  const [celebrate, setCelebrate] = useState(!!location.state?.justCreated);

  useEffect(() => {
    if (!id) return;
    supabase.from("dollar_locks").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => setLock(data as DollarLock | null));
  }, [id]);

  useEffect(() => {
    if (celebrate) {
      const t = setTimeout(() => setCelebrate(false), 3000);
      return () => clearTimeout(t);
    }
  }, [celebrate]);

  if (!lock) return <div className="p-6 text-center text-muted-foreground">Loading vault...</div>;

  const challenge = challengeFor(lock.lock_days);
  const principal = Number(lock.principal_usd);

  return (
    <div className="pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {celebrate && <ConfettiBurst trigger />}

      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate("/vault")} className="h-9 w-9 -ml-2 flex items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{challenge.emoji} Challenge</div>
          <h1 className="text-[20px] font-bold">{lock.challenge_name}</h1>
        </div>
      </header>

      <div className="mx-5 rounded-[28px] p-6 text-white shadow-soft-lg text-center"
           style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d5f8b 50%, #4a90c2 100%)" }}>
        <div className="mx-auto h-20 w-20 rounded-3xl bg-white/10 flex items-center justify-center mb-4">
          <Vault className="h-10 w-10" />
        </div>
        <div className="text-xs uppercase tracking-wider opacity-70">Locked</div>
        <div className="text-4xl font-bold mt-1">{fmtUSD(principal)}</div>
        {rate && <div className="text-xs opacity-70 mt-1">≈ {fmtNGN(principal * rate)} at today's rate</div>}

        {lock.status === "active" && (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-wider opacity-70 mb-3">Unlocks in</div>
            <LockCountdown matureAt={lock.mature_at} />
          </div>
        )}
        {lock.status === "matured" && (
          <div className="mt-6 text-2xl font-bold">Unlocked!</div>
        )}
        {lock.status === "broken" && (
          <div className="mt-6 text-sm opacity-80">Closed · Penalty: {fmtUSD(Number(lock.penalty_usd))}</div>
        )}
      </div>

      <div className="px-5 mt-6 space-y-3">
        <Row label="Started" value={new Date(lock.start_at).toLocaleDateString()} />
        <Row label="Unlocks on" value={new Date(lock.mature_at).toLocaleDateString()} />
        <Row label="Period" value={`${lock.lock_days} days`} />
        {rate && (
          <Row label="Live rate" value={`$1 = ${fmtNGN(rate)}`} />
        )}
      </div>

      {lock.status === "active" && (
        <div className="px-5 mt-8">
          <div className="rounded-2xl border border-border bg-muted/40 p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <LockIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xs text-muted-foreground">
              <b className="text-foreground">This challenge is locked.</b> Funds
              are released automatically on the unlock date. Early withdrawal is
              disabled — this protects your savings from impulse spending.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between rounded-xl bg-muted/40 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
