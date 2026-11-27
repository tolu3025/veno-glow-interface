import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserCampus {
  id: string;
  name: string;
}

/**
 * Resolves the current user's campus from their profile.university by
 * matching against the admin-managed campuses table. Returns null when the
 * university string doesn't map to any active campus.
 */
export function useUserCampus() {
  const { user, profile } = useAuth();
  const [campus, setCampus] = useState<UserCampus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const uni = (profile as any)?.university?.trim();
    if (!user || !uni) {
      setCampus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("campuses")
      .select("id, name, aliases")
      .eq("is_active", true)
      .then(({ data }) => {
        if (cancelled) return;
        const lower = uni.toLowerCase();
        const match = (data ?? []).find(
          (c: any) =>
            c.name.toLowerCase() === lower ||
            (c.aliases ?? []).some((a: string) => a.toLowerCase() === lower),
        );
        setCampus(match ? { id: match.id, name: match.name } : null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  return { campus, loading };
}
