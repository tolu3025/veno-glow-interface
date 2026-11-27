import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns whether the current user is an approved runner.
 * Source of truth: `runner_applications.status = 'approved'`.
 */
export function useIsRunner() {
  const { user } = useAuth();
  const [isRunner, setIsRunner] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsRunner(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("runner_applications" as any)
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();
      if (!cancelled) setIsRunner(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isRunner: isRunner === true, loading: isRunner === null };
}
