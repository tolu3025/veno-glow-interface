import { supabase } from "@/integrations/supabase/client";

export const readFunctionErrorBody = async (error: any) => {
  if (error?.context && typeof error.context.json === "function") {
    try { return await error.context.json(); } catch { return null; }
  }
  return null;
};

export const getAccessToken = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Your admin session has expired. Please sign in again.");
  }
  const { data: userData, error: userError } = await supabase.auth.getUser(data.session.access_token);
  if (userError || !userData.user) {
    await supabase.auth.signOut({ scope: "local" });
    throw new Error("Your admin session has expired. Please sign in again.");
  }
  return data.session.access_token;
};

export const invokeAdminOperation = async <T = any>(body: Record<string, unknown>) => {
  try {
    const token = await getAccessToken();
    const { data, error } = await supabase.functions.invoke("admin-operations", {
      body,
      headers: { Authorization: `Bearer ${token}` },
    });
    const errorBody = error ? await readFunctionErrorBody(error) : null;
    return { data: (errorBody ?? data) as T | null, error };
  } catch (error: any) {
    return { data: { success: false, error: error?.message || "Request failed" } as T, error };
  }
};

export const invokeClubkonnectBalance = async <T = any>() => {
  try {
    const token = await getAccessToken();
    const { data, error } = await supabase.functions.invoke("get-clubkonnect-balance", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const errorBody = error ? await readFunctionErrorBody(error) : null;
    return { data: (errorBody ?? data) as T | null, error };
  } catch (error: any) {
    return { data: { success: false, error: error?.message || "Request failed" } as T, error };
  }
};

export const getFunctionErrorMessage = (data: any, error?: any, fallback = "Request failed") =>
  data?.details || data?.error || error?.message || fallback;