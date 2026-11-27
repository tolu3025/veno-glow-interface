/** Squad transport with bounded waits. Never automatically retries money-moving POSTs. */
export type SquadApiResult<T> =
  | { kind: "success"; httpStatus: number; data: T }
  | { kind: "rejected"; httpStatus: number; data: null; message?: string }
  | { kind: "unknown"; httpStatus: number | null; data: null; message?: string };

export async function squadRequest<T>(baseUrl: string, path: string, secretKey: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<SquadApiResult<T>> {
  const base = new URL(baseUrl);
  if (base.protocol !== "https:" || !["api-d.squadco.com", "sandbox-api-d.squadco.com"].includes(base.hostname) || base.port || base.username || base.password) {
    throw new Error("Unsupported Squad API origin.");
  }
  if (!secretKey) throw new Error("Squad secret key is missing.");
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Invalid Squad API path.");
  const endpoint = new URL(path, base.origin);
  if (endpoint.origin !== base.origin) throw new Error("Invalid Squad API origin.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    // Plain string URL + manual redirect: Cloudflare Workers reject redirect "error".
    const response = await fetch(endpoint.toString(), {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
      redirect: "manual",
    });
    const raw = await response.json().catch(() => null) as { success?: boolean; status?: number; message?: unknown; data?: T } | null;
    const message = typeof raw?.message === "string" ? raw.message.slice(0, 200) : undefined;
    if (response.ok && raw?.success === true && raw.data !== undefined) return { kind: "success", httpStatus: response.status, data: raw.data };
    // A gateway error, redirect or malformed response cannot prove that a payout failed.
    if (response.status >= 500 || response.status === 408 || response.ok || (response.status >= 300 && response.status < 400)) return { kind: "unknown", httpStatus: response.status, data: null, message };
    return { kind: "rejected", httpStatus: response.status, data: null, message };
  } catch (err) {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("[squad-http] request failed", { path, detail: detail.slice(0, 300) });
    // Timeout/network failure may follow provider acceptance. Requery before refunding or resending.
    return { kind: "unknown", httpStatus: null, data: null, message: undefined };
  } finally {
    clearTimeout(timer);
  }
}