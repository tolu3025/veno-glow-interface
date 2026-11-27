import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Reads only the caller's Monnify account; legacy wallet account fields are never used. */
export function useMonnifyAccount(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["monnify-account", userId],
    enabled: Boolean(userId) && enabled,
    queryFn: async () => {
      if (!userId) throw new Error("Sign in to view your account.");
      const { data, error } = await supabase
        .from("monnify_virtual_accounts")
        .select("account_number,bank_name,account_name,status")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
