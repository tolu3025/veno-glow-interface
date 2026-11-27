/**
 * Organiser reward for big collections. Mirrors the SQL helper
 * public.collection_bonus_for_total — keep both in sync.
 */
export const COLLECTION_BONUS_TIERS = [
  { threshold: 100_000, bonus: 500 },
  { threshold: 250_000, bonus: 1_500 },
  { threshold: 500_000, bonus: 3_500 },
  { threshold: 1_000_000, bonus: 10_000 },
] as const;

export function bonusForTotal(total: number): number {
  let bonus = 0;
  for (const t of COLLECTION_BONUS_TIERS) {
    if (total >= t.threshold) bonus = t.bonus;
  }
  return bonus;
}

/** The next milestone the organiser hasn't reached yet, or null when maxed out. */
export function nextBonusTier(total: number) {
  return COLLECTION_BONUS_TIERS.find((t) => total < t.threshold) ?? null;
}

export const fmtNgn = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`;
