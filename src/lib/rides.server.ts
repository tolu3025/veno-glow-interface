// Server-only helpers for the Toyesek transport integration.
import { getRequestHeader } from "@tanstack/react-start/server";

const DEFAULT_BASE =
  "https://eltgagjjdgwtzjvtdqmz.supabase.co/functions/v1/partner-api";

export function toyesekBase() {
  return process.env["TOYESEK_API_URL"] || DEFAULT_BASE;
}

export async function toyesek(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: any }> {
  const key = process.env["TOYESEK_API_KEY"];
  if (!key) return { ok: false, status: 500, data: { error: "missing_key" } };

  const res = await fetch(`${toyesekBase()}${path}`, {
    ...init,
    headers: {
      "x-api-key": key,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

export function pickPrice(obj: any): number {
  if (!obj || typeof obj !== "object") return 0;
  const candidates = [
    obj.price,
    obj.price_per_seat,
    obj.travel_price,
    obj.amount,
    obj.fare,
    obj.fee,
    obj.cost,
    obj.seat_price,
    obj.ticket_price,
    obj.price_naira,
    obj.amount_naira,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

/** Verifies the caller's transaction PIN using the existing edge function. */
export async function verifyPinWithEdge(
  pin: string,
): Promise<{ ok: boolean; error?: string }> {
  const url = process.env["SUPABASE_URL"];
  const anon =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  const auth = getRequestHeader("authorization");
  if (!url || !anon || !auth) return { ok: false, error: "Session expired. Please sign in again." };

  const res = await fetch(`${url}/functions/v1/verify-transaction-pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: auth,
    },
    body: JSON.stringify({ pin }),
  });
  const data = await res.json().catch(() => ({}));
  if (data?.success) return { ok: true };
  if (data?.error === "no_pin_set") {
    return { ok: false, error: "Set your transaction PIN in Profile first." };
  }
  return { ok: false, error: data?.error || "Incorrect PIN" };
}
