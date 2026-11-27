// Flutterwave v3 shared client.
// Auth: static secret key (FLUTTERWAVE_SECRET_KEY, "FLWSECK-...") sent as a Bearer token.
// Base API: https://api.flutterwave.com/v3
//
// This module intentionally exposes the SAME function surface the app used with
// the v4 client, so every edge function keeps working unchanged.

export const FLW_BASE = "https://api.flutterwave.com/v3";

function secretKey(): string {
  const key = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
  if (!key) throw new Error("Flutterwave not configured (FLUTTERWAVE_SECRET_KEY missing)");
  return key;
}

export interface FlwRequestOpts {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: FlwRequestOpts["query"]) {
  const url = new URL(FLW_BASE + (path.startsWith("/") ? path : `/${path}`));
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function flwFetch<T = any>(
  path: string,
  opts: FlwRequestOpts = {},
): Promise<{ ok: boolean; status: number; data: T | null; raw: any }> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey()}`,
    Accept: "application/json",
    ...(opts.headers || {}),
  };
  if (method !== "GET" && method !== "DELETE") {
    headers["Content-Type"] = "application/json";
  }

  let res!: Response;
  let text = "";
  let attempt = 0;
  const maxAttempts = 3;
  while (attempt < maxAttempts) {
    attempt++;
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    text = await res.text();
    if (res.status >= 502 && res.status <= 504 && attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 400 * attempt));
      continue;
    }
    break;
  }

  let raw: any = null;
  try { raw = text ? JSON.parse(text) : null; } catch { raw = { raw_text: text }; }
  if (res.status >= 502 && res.status <= 504 && !raw?.message) {
    raw = { ...(raw || {}), message: "Flutterwave is temporarily unavailable. Please try again in a moment." };
  }
  return {
    ok: res.ok && (raw?.status ? raw.status === "success" : true),
    status: res.status,
    data: (raw?.data ?? null) as T | null,
    raw,
  };
}

// ─────────────────────────────────────────────────────────────
// Banks & transfers
// ─────────────────────────────────────────────────────────────

export interface V4Bank { id?: string; code: string; name: string }

export async function listBanksNG(): Promise<V4Bank[]> {
  const r = await flwFetch<V4Bank[]>("/banks/NG");
  return Array.isArray(r.data) ? r.data : [];
}

export async function resolveAccount(account_number: string, account_bank: string) {
  return flwFetch<{ account_number: string; account_name: string }>("/accounts/resolve", {
    method: "POST",
    body: { account_number, account_bank },
  });
}

/**
 * Create a bank transfer (v3 POST /transfers).
 * Returns { data: { id, status } } — callers store `data.id` as the transfer ref.
 */
export async function createDirectTransfer(input: {
  amount: number;
  account_number: string;
  account_bank: string;
  reference: string;
  narration?: string;
  beneficiary_name?: string;
}) {
  return flwFetch<{ id: string; status: string; reference?: string }>("/transfers", {
    method: "POST",
    body: {
      account_bank: input.account_bank,
      account_number: input.account_number,
      amount: input.amount,
      currency: "NGN",
      reference: input.reference,
      narration: input.narration ?? "KukaPay withdrawal",
      beneficiary_name: input.beneficiary_name,
    },
  });
}

export async function getDirectTransfer(id: string) {
  return flwFetch<{ id: string; status: string; reference?: string }>(
    `/transfers/${encodeURIComponent(id)}`,
  );
}

// ─────────────────────────────────────────────────────────────
// Virtual accounts
// ─────────────────────────────────────────────────────────────

/**
 * v3 has no separate customer object — virtual accounts are created directly.
 * Kept for API compatibility with the previous client.
 */
export async function createCustomer(input: {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}) {
  return {
    ok: true,
    status: 200,
    data: { id: input.email },
    raw: { status: "success", data: { id: input.email } },
  };
}

/** Normalise an identity number to exactly 11 digits, or null. */
function digits11(value?: string | null): string | null {
  const d = (value || "").replace(/\D+/g, "");
  return d.length === 11 && d[0] !== "0" ? d : null;
}

/**
 * Sanitise a virtual-account label so banks display it cleanly.
 * Keeps letters, digits, spaces, "/" and "-", collapses whitespace and trims
 * to a length that survives most bank statement fields.
 */
export function sanitizeAccountLabel(label?: string | null, max = 30): string {
  const cleaned = (label || "")
    .replace(/[^A-Za-z0-9 /\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const value = cleaned || "Kukapay";
  return value.length > max ? value.slice(0, max).trim() : value;
}

/**
 * Create a permanent (static) NGN virtual account — v3 POST /virtual-account-numbers.
 * Accepts a NIN (preferred, collected at KYC Level 1) or a BVN.
 *
 * On v3 the *merchant* controls the name shown to senders via `narration`
 * (echoed back as `note`). We therefore send our own label and do NOT let the
 * account holder's first/last name drive the display name.
 */

export async function createVirtualAccount(input: {
  reference: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  bvn?: string;
  nin?: string;
  narration?: string;
}) {
  const label = sanitizeAccountLabel(input.narration);
  const body: Record<string, unknown> = {
    email: input.email,
    is_permanent: true,
    tx_ref: input.reference,
    // v3: this is the field that names the account for the sender.
    narration: label,
    firstname: input.first_name,
    lastname: input.last_name,
    phonenumber: input.phone,
  };
  // v3 accepts EITHER `bvn` or `nin` (11 digits) as the identity of the account
  // holder. We collect NIN at KYC Level 1, so send it in its own `nin` field.
  const bvn = digits11(input.bvn);
  const nin = digits11(input.nin);
  if (bvn) body.bvn = bvn;
  if (nin) body.nin = nin;
  if (!bvn && !nin) {
    return {
      ok: false,
      status: 400,
      data: null,
      raw: { message: "A valid 11-digit NIN or BVN is required to create a virtual account." },
    };
  }

  // Optional: pin the issuing bank (e.g. Flutterwave MFB) when configured.
  const bankCode = Deno.env.get("FLUTTERWAVE_V3_VA_BANK_CODE");
  if (bankCode) body.bank_code = bankCode;

  return flwFetch<{
    account_number: string;
    bank_name?: string;
    order_ref?: string;
    note?: string;
  }>("/virtual-account-numbers", { method: "POST", body });
}


/**
 * One-shot: issue a static NGN virtual account.
 * `narration` is the label senders should see (e.g. "Kukapay" or
 * "Kukapay/Hostel Fees"). The name Flutterwave echoes back is returned as
 * `account_name` so callers can store exactly what was registered.
 */
export async function provisionVirtualAccount(input: {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  bvn?: string;
  nin?: string;
  reference: string;
  narration?: string;
}): Promise<
  | {
      ok: true;
      account_number: string;
      bank_name: string;
      account_name: string;
      customer_id: string;
      reference: string;
    }
  | { ok: false; error: string; raw?: any }
> {
  const label = sanitizeAccountLabel(input.narration);
  console.log("[flw-v3] provisioning VA label:", label);
  const va = await createVirtualAccount({
    reference: input.reference,
    email: input.email,
    first_name: input.first_name,
    last_name: input.last_name,
    phone: input.phone,
    bvn: input.bvn,
    nin: input.nin,
    narration: label,
  });
  console.log("[flw-v3] VA response:", JSON.stringify(va.raw));
  const acct = va.data?.account_number || va.raw?.data?.account_number;
  const bank = va.data?.bank_name || va.raw?.data?.bank_name || "";
  const note = va.data?.note || va.raw?.data?.note || "";
  if (!va.ok || !acct) {
    return {
      ok: false,
      error: va.raw?.message || va.raw?.error?.message || "Could not issue virtual account",
      raw: va.raw,
    };
  }
  return {
    ok: true,
    account_number: acct,
    bank_name: bank,
    account_name: sanitizeAccountLabel(note || label),
    customer_id: input.email,
    reference: input.reference,
  };
}


// ─────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────

export async function verifyChargeByReference(reference: string) {
  return flwFetch<any>("/transactions/verify_by_reference", { query: { tx_ref: reference } });
}

export async function getTransactionById(id: string) {
  return flwFetch<any>(`/transactions/${encodeURIComponent(id)}/verify`);
}

/**
 * FX rate lookup. Primary source is exchangerate-api.com (live mid rates);
 * falls back to Flutterwave v3 /transfers/rates.
 */
export async function getFxRate(source_currency: string, destination_currency: string, amount = 100) {
  const apiKey = Deno.env.get("EXCHANGERATE_API_KEY");
  if (apiKey) {
    try {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${encodeURIComponent(source_currency)}`,
      );
      const json = await res.json();
      const rate = Number(json?.conversion_rates?.[destination_currency]);
      if (Number.isFinite(rate) && rate > 0) return rate;
    } catch (e) {
      console.error("[flutterwave-v3] exchangerate-api lookup failed", e);
    }
  }
  try {
    const r = await flwFetch<any>("/transfers/rates", {
      query: { amount, destination_currency, source_currency },
    });
    const rate = Number(r.data?.rate ?? r.raw?.data?.rate);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

// ─────── Bill payments (airtime / data / utilities) ─────────

export async function listBillCategories(query: Record<string, string | number> = {}) {
  return flwFetch<any[]>("/bill-categories", { query: { country: "NG", ...query } });
}

export async function createBillPayment(input: {
  reference: string;
  category_code?: string;
  biller_code?: string;
  item_code?: string;
  amount: number;
  currency?: string;
  customer_id?: string;
  customer: { phone?: string; email?: string; name?: string };
}) {
  return flwFetch<{ id: string; status: string; reference?: string }>("/bills", {
    method: "POST",
    body: {
      country: "NG",
      customer: input.customer.phone || input.customer.email,
      amount: input.amount,
      recurrence: "ONCE",
      type: input.item_code || input.biller_code || input.category_code,
      reference: input.reference,
      biller_name: input.customer.name,
    },
  });
}

/**
 * v3 webhook verification: Flutterwave sends the dashboard "Secret hash" in the
 * `verif-hash` header. We also accept the HMAC-SHA256 v4 style header so events
 * queued during the cutover still verify.
 */
export async function verifyWebhookSignature(req: Request, rawBody: string): Promise<boolean> {
  const secret =
    Deno.env.get("FLW_SECRET_HASH") ||
    Deno.env.get("FLUTTERWAVE_WEBHOOK_SECRET") ||
    Deno.env.get("FLW_WEBHOOK_HASH");
  if (!secret) return false;

  const hash = req.headers.get("verif-hash");
  if (hash && hash === secret) return true;

  const sig = req.headers.get("flutterwave-signature") || req.headers.get("x-flutterwave-signature");
  if (!sig) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
