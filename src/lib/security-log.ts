import { supabase } from "@/integrations/supabase/client";

const getClientIp = async () => {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (!res.ok) return null;
    const body = await res.json();
    return typeof body.ip === "string" ? body.ip : null;
  } catch {
    return null;
  }
};

export const recordSecurityLog = async (entry: {
  user_id: string;
  action: string;
  success?: boolean;
}) => {
  const ip_address = await getClientIp();
  return supabase.from("security_logs").insert({
    user_id: entry.user_id,
    action: entry.action,
    success: entry.success ?? true,
    ip_address,
  });
};