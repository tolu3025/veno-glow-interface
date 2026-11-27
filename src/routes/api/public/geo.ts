import { createFileRoute } from "@tanstack/react-router";

/**
 * Returns the caller's coarse network location from edge headers.
 * No secrets, no user data — used only for session risk scoring.
 */
export const Route = createFileRoute("/api/public/geo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const h = request.headers;
        const ip =
          h.get("cf-connecting-ip") ||
          h.get("x-real-ip") ||
          (h.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
          null;
        return new Response(
          JSON.stringify({
            ip,
            country: h.get("cf-ipcountry") || null,
            city: h.get("cf-ipcity") || null,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          },
        );
      },
    },
  },
});
