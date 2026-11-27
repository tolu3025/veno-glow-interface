import { z } from "zod";

// VA amount strings are NGN decimal amounts, unlike Squad payout amounts (kobo).
export function nairaToKobo(value: string): number {
  if (!/^\d{1,11}(\.\d{1,2})?$/.test(value)) throw new Error("Invalid NGN amount");
  const [whole, fraction = ""] = value.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result <= 0) throw new Error("Invalid NGN amount");
  return result;
}

const amount = z.string().regex(/^\d{1,11}(\.\d{1,2})?$/);
export const squadDepositSchema = z.object({
  transaction_reference: z.string().min(1).max(200),
  virtual_account_number: z.string().regex(/^\d{10}$/),
  customer_identifier: z.string().min(1).max(100),
  principal_amount: amount,
  settled_amount: amount,
  currency: z.literal("NGN"),
  transaction_indicator: z.literal("C"),
  channel: z.literal("virtual-account"),
  version: z.union([z.string(), z.number()]).optional(),
  meta: z.object({ freeze_transaction_ref: z.string().nullish(), reason_for_frozen_transaction: z.string().nullish() }).nullish(),
});
export type SquadDeposit = z.infer<typeof squadDepositSchema>;

export function signatureInput(raw: string, payload: SquadDeposit): string {
  const version = String(payload.version ?? "1").toLowerCase().replace(/^v/, "");
  if (version === "1") return raw;
  if (version !== "2" && version !== "3") throw new Error("Unsupported webhook version");
  return [payload.transaction_reference, payload.virtual_account_number, payload.currency, payload.principal_amount, payload.settled_amount, payload.customer_identifier].join("|");
}

export function matchesVerifiedDeposit(payload: SquadDeposit, candidate: unknown): boolean {
  const parsed = z.object({
    transaction_reference: z.string(), virtual_account_number: z.string(),
    principal_amount: amount, settled_amount: amount, currency: z.literal("NGN"), transaction_indicator: z.literal("C"),
    customer_identifier: z.string().optional(),
    customer: z.object({ customer_identifier: z.string() }).optional(),
    frozen_transaction: z.unknown().optional(), froze_transaction: z.unknown().optional(),
    meta: z.object({ freeze_transaction_ref: z.string().nullish(), reason_for_frozen_transaction: z.string().nullish() }).nullish(),
  }).safeParse(candidate);
  if (!parsed.success) return false;
  const row = parsed.data;
  if (Number(row.principal_amount) <= 0 || Number(row.settled_amount) <= 0
    || Number(payload.principal_amount) <= 0 || Number(payload.settled_amount) <= 0) return false;
  // Squad documents both spellings. Require explicit null, not an omitted freeze state.
  const unfrozen = row.frozen_transaction === null || row.froze_transaction === null;
  return unfrozen && !row.frozen_transaction && !row.froze_transaction && !row.meta?.freeze_transaction_ref && !row.meta?.reason_for_frozen_transaction
    && row.transaction_reference === payload.transaction_reference
    && row.virtual_account_number === payload.virtual_account_number
    && (row.customer_identifier ?? row.customer?.customer_identifier) === payload.customer_identifier
    && nairaToKobo(row.principal_amount) === nairaToKobo(payload.principal_amount)
    && nairaToKobo(row.settled_amount) === nairaToKobo(payload.settled_amount)
    && nairaToKobo(row.settled_amount) <= nairaToKobo(row.principal_amount);
}

export const squadActivationSchema = z.object({
  bvn: z.string().regex(/^\d{11}$/, "Enter your 11-digit BVN."),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getTime() < Date.now();
  }, "Enter a valid date of birth."),
  gender: z.enum(["1", "2"]),
  address: z.string().trim().min(5).max(200),
});