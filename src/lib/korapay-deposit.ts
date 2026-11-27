import { z } from "zod";

export const korapayActivationSchema = z.object({
  /** Korapay accepts both BVN and NIN; we collect both and send whichever is applicable. */
  bvn: z
    .string()
    .regex(/^\d{11}$/, "Enter your 11-digit BVN.")
    .optional(),
  nin: z
    .string()
    .regex(/^\d{11}$/, "Enter your 11-digit NIN.")
    .optional(),
}).refine((d) => d.bvn || d.nin, {
  message: "Provide either your BVN or NIN.",
});

export const korapayVirtualAccountResponseSchema = z.object({
  account_number: z.string().regex(/^\d{10}$/),
  account_name: z.string().min(1),
  bank_name: z.string().min(1),
  bank_code: z.string().optional(),
  account_reference: z.string().min(1),
  expiry_date: z.string().nullable().optional(),
});

export const korapayWebhookSchema = z.object({
  event: z.string().min(1).max(100),
  data: z
    .object({
      reference: z.string().min(1).max(200),
      status: z.string().min(1),
      amount: z.union([z.number(), z.string()]),
      currency: z.string().optional(),
      customer: z
        .object({
          email: z.string().optional(),
        })
        .passthrough()
        .optional(),
      metadata: z.record(z.unknown()).optional(),
    })
    .passthrough(),
});

export const korapayTransactionSchema = z.object({
  reference: z.string(),
  status: z.string(),
  amount: z.union([z.number(), z.string()]),
  currency: z.string().optional(),
  payer_bank_account: z
    .object({
      account_number: z.string().optional(),
      bank_code: z.string().optional(),
    })
    .passthrough()
    .optional(),
  metadata: z.record(z.unknown()).optional(),
}).passthrough();

export const korapayPayoutResultSchema = z.object({
  reference: z.string(),
  status: z.string(),
  amount: z.union([z.number(), z.string()]),
  currency: z.string(),
  recipient: z.object({
    account_number: z.string(),
    bank_code: z.string(),
    name: z.string().optional(),
  }).passthrough().optional(),
  transaction_id: z.string().optional(),
}).passthrough();

export function amountToKobo(value: number | string): number {
  const s = typeof value === "number" ? value.toFixed(2) : value.trim();
  if (!/^\d{1,11}(\.\d{1,2})?$/.test(s)) throw new Error("Invalid NGN amount");
  const [w, f = ""] = s.split(".");
  const k = Number(w) * 100 + Number(f.padEnd(2, "0"));
  if (!Number.isSafeInteger(k) || k <= 0) throw new Error("Invalid NGN amount");
  return k;
}

/** Korapay signs webhooks with HMAC-SHA256(secretKey, rawBody) as lowercase hex. */
export async function verifyKorapaySignature(
  raw: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature || !secret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)),
  );
  const expected = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  const given = signature.trim().toLowerCase();
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++)
    diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

export function korapayPayoutOutcome(
  value: unknown,
  expected: {
    reference: string;
    amountKobo: number;
    bankCode: string;
    accountNumber: string;
  },
) {
  const parsed = korapayPayoutResultSchema.safeParse(value);
  if (!parsed.success) return null;
  const tx = parsed.data;
  try {
    if (tx.reference !== expected.reference || tx.currency !== "NGN")
      return null;
    if (amountToKobo(tx.amount) !== expected.amountKobo) return null;
    if (
      tx.recipient &&
      (tx.recipient.bank_code !== expected.bankCode ||
        tx.recipient.account_number !== expected.accountNumber)
    )
      return null;
  } catch {
    return null;
  }
  // Korapay statuses: "success", "failed", "processing", "pending"
  const outcome =
    tx.status === "success"
      ? "completed"
      : tx.status === "failed"
        ? "refunded"
        : "processing";
  return {
    outcome,
    status: tx.status,
    providerReference: tx.transaction_id ?? null,
  } as const;
}

export function korapayReceiptStatus(status: string) {
  return status === "completed"
    ? "Successful"
    : status === "refunded" || status === "reversed"
      ? "Refunded"
      : status === "failed"
        ? "Failed"
        : "Processing";
}
