import { supabase } from "@/integrations/supabase/client";
import { getFriendlyError } from "./edgeFunctionError";

/**
 * Wrap supabase.functions.invoke with friendly-error mapping and 429 handling.
 * Throws an Error whose `.message` is safe to show to the user via toast.
 *
 * Throws on:
 *  - transport error
 *  - HTTP 429 → "You're doing that too fast..."
 *  - `data.error` present
 *  - `data.success === false`
 */
export async function friendlyInvoke<T = any>(
  fn: string,
  opts: { body?: any; headers?: Record<string, string> } = {},
  fallback: string = "Something went wrong. Please try again."
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(fn, opts);
  const anyData = data as any;

  const status = (error as any)?.context?.status ?? (error as any)?.status;
  if (status === 429 || anyData?.error === "rate_limited") {
    throw new Error("You're doing that too fast. Try again in a moment.");
  }

  if (error || anyData?.error) {
    throw new Error(getFriendlyError(error, anyData, fallback));
  }
  // Some edge fns return { success: false } without an error field
  if (anyData && typeof anyData === "object" && "success" in anyData && anyData.success === false) {
    throw new Error(fallback);
  }
  return data as T;
}
