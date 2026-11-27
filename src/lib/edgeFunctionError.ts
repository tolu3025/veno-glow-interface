/**
 * Converts raw edge function errors into user-friendly messages.
 * 
 * Edge functions may return cryptic 2xx/5xx error objects. This utility
 * extracts meaningful messages or falls back to a friendly default.
 */

const FRIENDLY_FALLBACK = "Something went wrong. Please try again.";

// Known business-logic errors that should be passed through as-is
const PASSTHROUGH_PATTERNS = [
  /insufficient balance/i,
  /incorrect pin/i,
  /wallet not found/i,
  /already paid/i,
  /not found/i,
  /not active/i,
  /no longer/i,
  /minimum/i,
  /maximum/i,
  /limit/i,
  /sold out/i,
  /already have/i,
  /complete level/i,
  /name mismatch/i,
  /locked/i,
  /suspended/i,
  /duplicate/i,
  /already exists/i,
  /requester has insufficient/i,
  /cannot accept your own/i,
  /must be in progress/i,
  /only the requester/i,
  /verify your identity/i,
  /complete your profile/i,
  /payment account/i,
  /kyc/i,
  /bvn/i,
  /\bnin\b/i,
  /flutterwave/i,
];

function isBusinessError(message: string): boolean {
  return PASSTHROUGH_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Extract a user-friendly error message from an edge function response.
 * 
 * @param error - The `error` returned from `supabase.functions.invoke()`
 * @param data - The `data` returned from `supabase.functions.invoke()` (may contain `data.error`)
 * @param fallback - Optional custom fallback message
 * @returns A user-friendly error string
 */
export function getFriendlyError(
  error: unknown,
  data?: { error?: string } | null,
  fallback: string = FRIENDLY_FALLBACK
): string {
  // First check data.error — these are typically business-logic messages from our own code
  if (data?.error && typeof data.error === "string") {
    if (isBusinessError(data.error)) {
      return data.error;
    }
  }

  // If there's an edge function transport error, give a generic message
  if (error) {
    return fallback;
  }

  // data.error exists but isn't a known business error — still show it if it's short/readable
  if (data?.error && typeof data.error === "string" && data.error.length < 120) {
    return data.error;
  }

  return fallback;
}
