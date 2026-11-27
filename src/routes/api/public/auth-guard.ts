import { createFileRoute } from "@tanstack/react-router";

/**
 * Adaptive rate-limit gate for sign-in attempts.
 * The browser calls this before and after a password sign-in; the real caller
 * IP comes from edge headers, and the verdict comes from the database ladder.
 */
export const Route = createFileRoute("/api/public/auth-guard")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          });

        const h = request.headers;
        const ip =
          h.get("cf-connecting-ip") ||
          h.get("x-real-ip") ||
          (h.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
          "";
        if (!ip) return json({ allowed: true });

        let action = "signin";
        let success = true;
        try {
          const body = (await request.json()) as { action?: string; success?: boolean };
          if (body?.action === "signin_failed") {
            action = "signin";
            success = false;
          }
          if (typeof body?.success === "boolean") success = body.success;
        } catch {
          /* defaults */
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.rpc("check_adaptive_limit", {
            _ip: ip,
            _action: action,
            _max_requests: 12,
            _window_seconds: 60,
            _success: success,
          });
          if (error || !data) return json({ allowed: true });
          const verdict = data as { allowed: boolean; level?: string; retry_after_seconds?: number };
          if (verdict.allowed) return json({ allowed: true });
          const secs = verdict.retry_after_seconds ?? 60;
          const mins = Math.ceil(secs / 60);
          const message =
            secs > 3600
              ? "Too many sign-in attempts from your network. Access is paused for a few hours."
              : secs > 300
                ? `Too many sign-in attempts. Please wait about ${mins} minutes and try again.`
                : "Too many sign-in attempts. Please wait a moment and try again.";
          return json({ allowed: false, message, retry_after_seconds: secs }, 429);
        } catch {
          return json({ allowed: true });
        }
      },
    },
  },
});
