import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UsdWallet {
  available_usd: number;
  locked_usd: number;
}

export interface DollarLock {
  id: string;
  principal_usd: number;
  lock_days: number;
  challenge_name: string;
  start_at: string;
  mature_at: string;
  status: "active" | "matured" | "broken";
  penalty_applied: boolean;
  penalty_usd: number;
  matured_at: string | null;
  broken_at: string | null;
}

export function useUsdWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<UsdWallet | null>(null);
  const [locks, setLocks] = useState<DollarLock[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [wRes, lRes] = await Promise.all([
      supabase.from("usd_wallets").select("available_usd, locked_usd").eq("user_id", user.id).maybeSingle(),
      supabase.from("dollar_locks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setWallet(wRes.data ?? { available_usd: 0, locked_usd: 0 });
    setLocks((lRes.data as DollarLock[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const channel = supabase
      .channel(`usd-wallet-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "usd_wallets", filter: `user_id=eq.${user.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "dollar_locks", filter: `user_id=eq.${user.id}` }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refresh]);

  return { wallet, locks, loading, refresh };
}
