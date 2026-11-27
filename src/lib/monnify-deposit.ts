import { z } from "zod";

export const monnifyActivationSchema = z.object({
  nin: z.string().regex(/^\d{11}$/, "Enter your 11-digit NIN."),
});

export const ninVerificationSchema = z.object({
  nin: z.string(),
  matched: z.boolean().optional(),
}).passthrough();

export const reservedAccountSchema = z.object({
  accountReference: z.string(),
  accountName: z.string().optional(),
  accounts: z.array(z.object({ bankCode: z.string().optional(), bankName: z.string(), accountNumber: z.string().regex(/^\d{10}$/), accountName: z.string().optional() })).min(1),
});

export const monnifyWebhookSchema = z.object({
  eventType: z.string(),
  eventData: z.object({
    transactionReference: z.string().min(1).max(200),
    amountPaid: z.union([z.number(), z.string()]),
    paymentStatus: z.string(),
    currency: z.string().optional(),
    product: z.object({ type: z.string(), reference: z.string().min(1).max(100) }),
  }).passthrough(),
});

export const verifiedTransactionSchema = z.object({
  transactionReference: z.string(),
  paymentStatus: z.string(),
  amountPaid: z.union([z.number(), z.string()]),
  currencyCode: z.string().optional(),
  product: z.object({ type: z.string(), reference: z.string() }).optional(),
}).passthrough();

export function amountToKobo(value: number | string): number {
  const s = typeof value === "number" ? value.toFixed(2) : value.trim();
  if (!/^\d{1,11}(\.\d{1,2})?$/.test(s)) throw new Error("Invalid NGN amount");
  const [w, f = ""] = s.split(".");
  const k = Number(w) * 100 + Number(f.padEnd(2, "0"));
  if (!Number.isSafeInteger(k) || k <= 0) throw new Error("Invalid NGN amount");
  return k;
}

/** Monnify signs webhooks with HMAC-SHA512(clientSecret, rawBody) as lowercase hex. */
export async function verifyMonnifySignature(raw: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
  const expected = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  const given = signature.trim().toLowerCase();
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
