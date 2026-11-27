import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserCampus } from "@/hooks/useUserCampus";

/**
 * Checks whether the current user's campus has any active merchants and any
 * approved runners. Used to gate the Merchants directory and the Errands
 * marketplace with a friendly "feature not live at your school yet" state.
 */
export function useCampusCoverage() {
  const { campus, loading: campusLoading } = useUserCampus();
  const [merchantCount, setMerchantCount] = useState<number | null>(null);
  const [runnerCount, setRunnerCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (campusLoading) return;
    if (!campus) {
      setMerchantCount(0);
      setRunnerCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      // Merchants: count active merchants on this campus (RLS already restricts).
      const { count: mCount } = await supabase
        .from("merchants")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .eq("campus_id", campus.id);

      // Runners: SECURITY DEFINER RPC checks approved runner_applications
      // whose university maps to this campus (name + aliases).
      const { data: hasRunner } = await supabase.rpc("campus_has_active_runner", {
        p_campus_id: campus.id,
      });

      if (cancelled) return;
      setMerchantCount(mCount ?? 0);
      setRunnerCount(hasRunner ? 1 : 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [campus, campusLoading]);

  return {
    campus,
    loading: loading || campusLoading,
    hasMerchants: (merchantCount ?? 0) > 0,
    hasRunners: (runnerCount ?? 0) > 0,
    merchantCount: merchantCount ?? 0,
    runnerCount: runnerCount ?? 0,
  };
}
