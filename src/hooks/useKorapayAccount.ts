import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Reads only the caller's Korapay virtual account; never falls back to Monnify fields. */
export function useKorapayAccount(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["korapay-account", userId],
    enabled: Boolean(userId) && enabled,
    queryFn: async () => {
      if (!userId) throw new Error("Sign in to view your account.");
      const { data, error } = await supabase
        .from("korapay_virtual_accounts")
        .select("account_number,bank_name,account_name,status")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
