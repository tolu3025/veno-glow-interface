// Squad (HabariPay / GTCO) API helpers — virtual accounts, payouts, webhooks.
// Docs: https://docs.squadco.com
const SQUAD_BASE = Deno.env.get("SQUAD_BASE_URL") || "https://api-d.squadco.com";

function key(): string {
  const k = Deno.env.get("SQUAD_SECRET_KEY");
  if (!k) throw new Error("SQUAD_SECRET_KEY not configured");
  return k;
}

export async function squadFetch<T = any>(path: string, init: { method?: string; body?: unknown } = {}) {
  const res = await fetch(`${SQUAD_BASE}${path}`, {
    method: init.method || "GET",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  let raw: any = null;
  try { raw = await res.json(); } catch { raw = { message: `HTTP ${res.status}` }; }
  const ok = res.ok && (raw?.success === true || raw?.status === 200);
  return { ok, httpStatus: res.status, data: raw?.data as T, raw };
}

// NIP institution codes used by Squad payouts.
export const SQUAD_BANKS: { name: string; code: string }[] = [
  { name: "Access Bank", code: "000014" },
  { name: "Citibank", code: "000009" },
  { name: "Ecobank", code: "000010" },
  { name: "Fidelity Bank", code: "000007" },
  { name: "First Bank of Nigeria", code: "000016" },
  { name: "First City Monument Bank (FCMB)", code: "000003" },
  { name: "Globus Bank", code: "000027" },
  { name: "Guaranty Trust Bank (GTBank)", code: "000013" },
  { name: "Heritage Bank", code: "000020" },
  { name: "Jaiz Bank", code: "000006" },
  { name: "Keystone Bank", code: "000002" },
  { name: "Lotus Bank", code: "000029" },
  { name: "Optimus Bank", code: "000036" },
  { name: "Parallex Bank", code: "000030" },
  { name: "Polaris Bank", code: "000008" },
  { name: "Premium Trust Bank", code: "000031" },
  { name: "Providus Bank", code: "000023" },
  { name: "Stanbic IBTC Bank", code: "000012" },
  { name: "Standard Chartered", code: "000021" },
  { name: "Sterling Bank", code: "000001" },
  { name: "SunTrust Bank", code: "000022" },
  { name: "Titan Trust Bank", code: "000025" },
  { name: "Union Bank", code: "000018" },
  { name: "United Bank for Africa (UBA)", code: "000004" },
  { name: "Unity Bank", code: "000011" },
  { name: "Wema Bank", code: "000017" },
  { name: "Zenith Bank", code: "000015" },
  { name: "OPay", code: "100004" },
  { name: "PalmPay", code: "100033" },
  { name: "Moniepoint MFB", code: "090405" },
  { name: "Kuda MFB", code: "090267" },
  { name: "Paga", code: "100002" },
  { name: "Carbon", code: "100026" },
  { name: "FairMoney MFB", code: "090551" },
  { name: "VFD MFB", code: "090110" },
  { name: "Rubies MFB", code: "090175" },
  { name: "Sparkle MFB", code: "090325" },
  { name: "Flutterwave MFB (Mint)", code: "090281" },
  { name: "Paystack-Titan", code: "100039" },
  { name: "GoMoney", code: "100022" },
];

export async function resolveAccount(account_number: string, bank_code: string) {
  const r = await squadFetch<{ account_name: string; account_number: string }>(
    "/payout/account/lookup", { method: "POST", body: { bank_code, account_number } },
  );
  return r;
}

/** Squad requires transfer references prefixed with the merchant ID. */
export function payoutReference(ref: string): string {
  const mid = Deno.env.get("SQUAD_MERCHANT_ID") || "";
  return mid ? `${mid}_${ref}` : ref;
}

export async function createTransfer(input: {
  amount: number; // naira
  bank_code: string;
  account_number: string;
  account_name: string;
  reference: string; // already prefixed
  remark: string;
}) {
  return squadFetch("/payout/transfer", {
    method: "POST",
    body: {
      transaction_reference: input.reference,
      amount: String(Math.round(input.amount * 100)), // kobo
      bank_code: input.bank_code,
      account_number: input.account_number,
      account_name: input.account_name,
      currency_id: "NGN",
      remark: input.remark.slice(0, 100),
    },
  });
}

export async function requeryTransfer(reference: string) {
  return squadFetch("/payout/requery", { method: "POST", body: { transaction_reference: reference } });
}

/** dob: YYYY-MM-DD → Squad wants MM/DD/YYYY */
export async function createCustomerVirtualAccount(input: {
  customer_identifier: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  bvn: string;
  dob: string;
  gender?: "1" | "2";
  address?: string;
}) {
  const [y, m, d] = input.dob.split("-");
  const phone = input.phone.replace(/\D/g, "").replace(/^234/, "0");
  const r = await squadFetch<{ virtual_account_number: string; bank_code?: string; first_name?: string; last_name?: string }>(
    "/virtual-account",
    {
      method: "POST",
      body: {
        customer_identifier: input.customer_identifier,
        first_name: input.first_name,
        last_name: input.last_name,
        mobile_num: phone,
        email: input.email,
        bvn: input.bvn,
        dob: `${m}/${d}/${y}`,
        gender: input.gender || "1",
        address: input.address || "Nigeria",
        beneficiary_account: Deno.env.get("SQUAD_BENEFICIARY_ACCOUNT") || undefined,
      },
    },
  );
  return r;
}

/** Squad signs webhook bodies: HMAC-SHA512(rawBody, secretKey), hex upper-case, header x-squad-encrypted-body */
export async function verifySquadSignature(req: Request, rawBody: string): Promise<boolean> {
  const sig = req.headers.get("x-squad-encrypted-body") || req.headers.get("x-squad-signature") || "";
  if (!sig) return false;
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", enc.encode(key()), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(rawBody)));
  const hex = Array.from(mac).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  if (hex.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ sig.toUpperCase().charCodeAt(i);
  return diff === 0;
}
