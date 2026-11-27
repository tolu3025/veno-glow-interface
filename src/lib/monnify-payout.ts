import { z } from "zod";
import { amountToKobo } from "./monnify-deposit";

export const payoutInputSchema = z.object({
  bankCode: z.string().regex(/^\d{2,12}$/),
  accountNumber: z.string().regex(/^\d{10}$/),
  amount: z.number().finite().min(1000).max(1000000).refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.00001, "Use at most two decimal places."),
  pin: z.string().regex(/^\d{4}$/),
  idempotencyKey: z.string().uuid(),
});

export const payoutSchema = z.object({
  reference: z.string(), amount: z.union([z.number(), z.string()]),
  status: z.string(), currency: z.string(),
  destinationBankCode: z.string(), destinationAccountNumber: z.string(),
  transactionReference: z.string().optional(),
}).passthrough();

export function payoutOutcome(value: unknown, expected: { reference: string; amountKobo: number; bankCode: string; accountNumber: string }) {
  const parsed = payoutSchema.safeParse(value);
  if (!parsed.success) return null;
  const tx = parsed.data;
  try {
    if (tx.reference !== expected.reference || tx.currency !== "NGN" || amountToKobo(tx.amount) !== expected.amountKobo
      || tx.destinationBankCode !== expected.bankCode || tx.destinationAccountNumber !== expected.accountNumber) return null;
  } catch { return null; }
  const outcome = tx.status === "SUCCESS" ? "completed" : ["FAILED", "REVERSED"].includes(tx.status) ? "refunded" : "processing";
  return { outcome, status: tx.status, providerReference: tx.transactionReference ?? null } as const;
}

export function receiptStatus(status: string) {
  return status === "completed" ? "Successful" : status === "refunded" || status === "reversed" ? "Refunded" : status === "failed" ? "Failed" : "Processing";
}