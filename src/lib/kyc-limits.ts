// Canonical KYC tier limits (Naira). Surfaced in UI + reused server-side via
// the matching get_kyc_limits SQL helper if needed.
export type KycTier = 0 | 1 | 2 | 3;

export const KYC_LIMITS: Record<KycTier, { maxBalance: number; dailyTx: number; label: string }> = {
  0: { maxBalance: 0, dailyTx: 0, label: "Unverified" },
  1: { maxBalance: 50_000, dailyTx: 20_000, label: "BVN verified" },
  2: { maxBalance: 200_000, dailyTx: 150_000, label: "Face + Student ID" },
  3: { maxBalance: 20_000_000, dailyTx: 10_000_000, label: "BVN + Address" },
};

export const formatNaira = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
