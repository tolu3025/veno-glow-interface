/** Server-only Monnify transport. Never retries money-moving calls automatically. */
export type MonnifyResult<T> =
  | { kind: "success"; httpStatus: number; data: T }
  | { kind: "rejected"; httpStatus: number; data: null; message?: string }
  | { kind: "unknown"; httpStatus: number | null; data: null; message?: string };

export function monnifyConfig() {
  const apiKey = process.env.MONNIFY_API_KEY ?? "";
  const secret = process.env.MONNIFY_SECRET_KEY ?? "";
  const contractCode = process.env.MONNIFY_CONTRACT_CODE ?? "";
  if (!apiKey || !secret || !contractCode) throw new Error("Monnify is not configured.");
  const base = apiKey.startsWith("MK_PROD") ? "https://api.monnify.com" : "https://sandbox.monnify.com";
  return { apiKey, secret, contractCode, base };
}

async function call(url: string, init: RequestInit): Promise<{ status: number | null; body: any; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, redirect: "manual" });
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch (err) {
    return { status: null, body: null, error: err instanceof Error ? `${err.name}: ${err.message}` : String(err) };
  } finally { clearTimeout(timer); }
}

async function token(cfg: ReturnType<typeof monnifyConfig>): Promise<string | null> {
  const r = await call(`${cfg.base}/api/v1/auth/login`, { method: "POST", headers: { Authorization: `Basic ${btoa(`${cfg.apiKey}:${cfg.secret}`)}` } });
  const t = r.body?.responseBody?.accessToken;
  if (typeof t !== "string") console.error("[monnify] login failed", { status: r.status, message: r.body?.responseMessage, error: r.error });
  return typeof t === "string" ? t : null;
}

export async function monnifyRequest<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<MonnifyResult<T>> {
  if (!path.startsWith("/api/") ) throw new Error("Invalid Monnify path.");
  const cfg = monnifyConfig();
  const bearer = await token(cfg);
  if (!bearer) return { kind: "unknown", httpStatus: null, data: null, message: "Monnify login failed" };
  const r = await call(`${cfg.base}${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json", Accept: "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const message = typeof r.body?.responseMessage === "string" ? r.body.responseMessage.slice(0, 200) : undefined;
  if (r.status === null) { console.error("[monnify] request failed", { path, error: r.error }); return { kind: "unknown", httpStatus: null, data: null }; }
  if (r.status >= 200 && r.status < 300 && r.body?.requestSuccessful === true && r.body.responseBody !== undefined)
    return { kind: "success", httpStatus: r.status, data: r.body.responseBody as T };
  if (r.status >= 500 || r.status === 408 || (r.status >= 200 && r.status < 400)) return { kind: "unknown", httpStatus: r.status, data: null, message };
  return { kind: "rejected", httpStatus: r.status, data: null, message };
}
