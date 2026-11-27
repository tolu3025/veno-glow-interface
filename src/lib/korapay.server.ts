/** Server-only Korapay transport. Never retries money-moving calls automatically. */
export type KorapayResult<T> =
  | { kind: "success"; httpStatus: number; data: T }
  | { kind: "rejected"; httpStatus: number; data: null; message?: string }
  | { kind: "unknown"; httpStatus: number | null; data: null; message?: string };

export function korapayConfig() {
  const secretKey = process.env.KORAPAY_SECRET_KEY ?? "";
  const publicKey = process.env.KORAPAY_PUBLIC_KEY ?? "";
  if (!secretKey || !publicKey) throw new Error("Korapay is not configured.");
  const base = secretKey.startsWith("sk_live_")
    ? "https://api.korapay.com"
    : "https://api.korapay.com"; // Korapay uses same base; sandbox uses sk_test_ prefix
  return { secretKey, publicKey, base };
}

async function call(
  url: string,
  init: RequestInit,
): Promise<{ status: number | null; body: unknown; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: "manual",
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch (err) {
    return {
      status: null,
      body: null,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function korapayRequest<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PUT"; body?: unknown } = {},
): Promise<KorapayResult<T>> {
  if (!path.startsWith("/merchant/api/v1/"))
    throw new Error("Invalid Korapay path.");
  const cfg = korapayConfig();
  const r = await call(`${cfg.base}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const body = r.body as {
    status?: boolean;
    message?: string;
    data?: T;
  } | null;
  const message =
    typeof body?.message === "string" ? body.message.slice(0, 200) : undefined;
  if (r.status === null) {
    console.error("[korapay] request failed", { path, error: r.error });
    return { kind: "unknown", httpStatus: null, data: null };
  }
  if (
    r.status >= 200 &&
    r.status < 300 &&
    body?.status === true &&
    body.data !== undefined
  )
    return { kind: "success", httpStatus: r.status, data: body.data as T };
  // 5xx / 408 / redirects / ambiguous 2xx without success flag → unknown (may have acted)
  if (
    r.status >= 500 ||
    r.status === 408 ||
    (r.status >= 200 && r.status < 400)
  )
    return { kind: "unknown", httpStatus: r.status, data: null, message };
  return { kind: "rejected", httpStatus: r.status, data: null, message };
}
