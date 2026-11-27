import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ConfettiBurst } from "@/components/shared/ConfettiBurst";
import { challengeFor, fmtUSD } from "@/lib/vaultChallenges";
import type { DollarLock } from "@/hooks/useUsdWallet";

export default function CelebratePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lock, setLock] = useState<DollarLock | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("dollar_locks").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => setLock(data as DollarLock | null));
  }, [id]);

  if (!lock) return null;
  const ch = challengeFor(lock.lock_days);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pb-28">
      <ConfettiBurst trigger />
      <div className="text-8xl mb-6 animate-bounce">🏆</div>
      <h1 className="text-3xl font-bold tracking-tightish">You did it!</h1>
      <p className="text-muted-foreground mt-2 max-w-xs">
        You completed the <b>{ch.name}</b> without breaking your lock. Discipline unlocked. 💪
      </p>
      <div className="mt-8 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-200 p-8 shadow-soft-lg">
        <div className="text-6xl">{ch.emoji}</div>
        <div className="mt-3 font-bold text-amber-900">{ch.name}</div>
        <div className="text-2xl font-bold text-amber-900 mt-1">{fmtUSD(Number(lock.principal_usd))}</div>
        <div className="text-xs text-amber-900/70 mt-1">Badge earned</div>
      </div>
      <div className="mt-8 space-y-2 w-full max-w-xs">
        <Button className="w-full h-12 rounded-2xl" onClick={() => navigate("/vault/lock/select")}>
          Start another challenge
        </Button>
        <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => navigate("/vault")}>
          Back to vault
        </Button>
      </div>
    </div>
  );
}
