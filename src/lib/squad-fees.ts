/** Target Squad pricing. Not used by live Flutterwave flows until cutover. */
export const SQUAD_MIN_WITHDRAWAL = 1_000;
export const SQUAD_MAX_WITHDRAWAL_FEE = 1_500;
export const EXTERNAL_COLLECTION_CONTRIBUTOR_FEE = 50;

export function squadWithdrawalQuote(amount: number) {
  if (!Number.isFinite(amount) || amount < SQUAD_MIN_WITHDRAWAL || Math.round(amount * 100) !== amount * 100) {
    throw new Error("Withdrawal must be at least ₦1,000 and use whole kobo.");
  }
  const fee = amount <= 3_000 ? 15 : amount < 10_000 ? 35 : Math.min(SQUAD_MAX_WITHDRAWAL_FEE, Math.round((amount * 0.02 + 50) * 100) / 100);
  return { amount, fee, totalDebit: Math.round((amount + fee) * 100) / 100, bankReceives: amount };
}

/** Only verified collection payout RPCs may use this exemption, never user input. */
export function squadCollectionPayoutQuote(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) throw new Error("Invalid collection payout amount.");
  return { amount, fee: 0, totalDebit: amount, bankReceives: amount };
}

export function collectionContributorFee(source: "external_bank" | "kukapay_wallet") {
  return source === "external_bank" ? EXTERNAL_COLLECTION_CONTRIBUTOR_FEE : 0;
}