/**
 * Centralized fee calculations for KukaPay.
 *
 * Withdrawals ("fee on top"): the bank receives exactly the amount entered;
 * the fee is debited from the wallet on top of it.
 *   ₦1,000 – ₦3,000   → flat ₦15
 *   ₦3,001 – ₦9,999   → flat ₦35
 *   ₦10,000+          → 2% + ₦50 stamp duty, total capped at ₦1,500
 * MUST stay in sync with computeFeeBreakdown in supabase/functions/process-withdrawal.
 */

export const FEE_RATES = {
  flutterwave: 0.02, // used for funding display only
  platform: 0.005,
} as const;

export const LOW_FLAT_CEILING = 3_000;
export const LOW_FLAT_FEE = 15;
export const MID_FLAT_FEE = 35;
export const PERCENT_RATE = 0.02;
export const STAMP_DUTY_THRESHOLD = 10_000;
export const STAMP_DUTY_AMOUNT = 50;

/** Hard ceiling on what a single withdrawal can ever cost the user. */
export const MAX_WITHDRAWAL_FEE = 1_500;

export interface WithdrawalBreakdown {
  amount: number;       // what the bank receives
  flutterwave: number;  // transfer fee portion
  platform: number;
  stampDuty: number;
  totalCharges: number;
  totalDebit: number;   // amount + charges, taken from wallet
  netReceive: number;   // === amount
  flat: boolean;
}

export interface FundingBreakdown {
  amount: number;
  flutterwave: number;
  platform: number;
  totalCharges: number;
  totalToPay: number;
  walletCredited: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function stampDuty(amount: number): number {
  return amount >= STAMP_DUTY_THRESHOLD ? STAMP_DUTY_AMOUNT : 0;
}

export function withdrawalBreakdown(amount: number): WithdrawalBreakdown {
  const a = Math.max(0, Number(amount) || 0);
  if (a === 0) {
    return { amount: 0, flutterwave: 0, platform: 0, stampDuty: 0, totalCharges: 0, totalDebit: 0, netReceive: 0, flat: false };
  }
  if (a < STAMP_DUTY_THRESHOLD) {
    const fee = a <= LOW_FLAT_CEILING ? LOW_FLAT_FEE : MID_FLAT_FEE;
    return { amount: a, flutterwave: fee, platform: 0, stampDuty: 0, totalCharges: fee, totalDebit: round2(a + fee), netReceive: a, flat: true };
  }
  let transfer = round2(a * PERCENT_RATE);
  if (transfer + STAMP_DUTY_AMOUNT > MAX_WITHDRAWAL_FEE) transfer = MAX_WITHDRAWAL_FEE - STAMP_DUTY_AMOUNT;
  const totalCharges = round2(transfer + STAMP_DUTY_AMOUNT);
  return { amount: a, flutterwave: transfer, platform: 0, stampDuty: STAMP_DUTY_AMOUNT, totalCharges, totalDebit: round2(a + totalCharges), netReceive: a, flat: false };
}

/** Largest payout whose amount + fee fits within `balance`. */
export function maxWithdrawableFor(balance: number): number {
  const b = Math.max(0, Number(balance) || 0);
  const candidates = [
    Math.min(LOW_FLAT_CEILING, b - LOW_FLAT_FEE),
    Math.min(STAMP_DUTY_THRESHOLD - 1, b - MID_FLAT_FEE),
    (b - STAMP_DUTY_AMOUNT) / (1 + PERCENT_RATE),
    b - MAX_WITHDRAWAL_FEE,
  ];
  let best = 0;
  for (const c of candidates) {
    const v = Math.floor(c);
    if (v > best && withdrawalBreakdown(v).totalDebit <= b) best = v;
  }
  return best;
}

export function fundingBreakdown(amount: number): FundingBreakdown {
  const a = Math.max(0, Number(amount) || 0);
  const flutterwave = round2(a * FEE_RATES.flutterwave);
  const platform = round2(a * FEE_RATES.platform);
  const totalCharges = round2(flutterwave + platform);
  return { amount: a, flutterwave, platform, totalCharges, totalToPay: round2(a + totalCharges), walletCredited: a };
}

export const formatNaira = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
