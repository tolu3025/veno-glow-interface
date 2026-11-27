// Shared adaptive rate limiting for edge functions.
// Uses the public.check_adaptive_limit RPC (service role only) which combines
// per-IP reputation, sliding-window counters and an escalating ban ladder.

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0]?.trim();
  return (
    first ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

export interface LimitVerdict {
  allowed: boolean;
  level?: string;
  retry_after_seconds?: number;
}

/**
 * Records the request against the caller's IP and returns the verdict.
 * Never throws — a limiter outage must not take payments offline.
 */
export async function checkAdaptiveLimit(
  admin: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> },
  req: Request,
  action: string,
  maxRequests = 30,
  windowSeconds = 60,
  success = true,
): Promise<LimitVerdict> {
  const ip = getClientIp(req);
  if (!ip) return { allowed: true };
  try {
    const { data, error } = await admin.rpc("check_adaptive_limit", {
      _ip: ip,
      _action: action,
      _max_requests: maxRequests,
      _window_seconds: windowSeconds,
      _success: success,
    });
    if (error || !data) return { allowed: true };
    return data as LimitVerdict;
  } catch {
    return { allowed: true };
  }
}

export function friendlyLimitMessage(v: LimitVerdict): string {
  const secs = v.retry_after_seconds ?? 60;
  if (v.level === "extended_ban" || secs > 3600) {
    return "Too many attempts from your network. Access is paused for a few hours. Contact support if this is a mistake.";
  }
  if (v.level === "temp_ban" || secs > 300) {
    const mins = Math.ceil(secs / 60);
    return `Too many attempts. Please wait about ${mins} minute${mins === 1 ? "" : "s"} and try again.`;
  }
  return "You're doing that too fast. Please wait a moment and try again.";
}

export function limitResponse(v: LimitVerdict, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({
      success: false,
      error: friendlyLimitMessage(v),
      rate_limited: true,
      retry_after_seconds: v.retry_after_seconds ?? 60,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(v.retry_after_seconds ?? 60),
      },
    },
  );
}
