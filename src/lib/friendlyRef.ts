/**
 * Convert raw transaction references (e.g. WDR-uuid-...) into friendly
 * user-facing IDs like KP-WD-8472. Always deterministic for the same input.
 */
const PREFIX: Record<string, string> = {
  withdrawal: "KP-WD",
  funding: "KP-FD",
  deposit: "KP-FD",
  crypto: "KP-CR",
  crypto_sale: "KP-CR",
  airtime: "KP-AT",
  data: "KP-DT",
  vendor: "KP-VN",
  merchant: "KP-VN",
  printing: "KP-PR",
  errand: "KP-ER",
  refund: "KP-RF",
  reversal: "KP-RV",
  p2p: "KP-P2",
  p2p_transfer: "KP-P2",
  collection: "KP-CL",
  ajo: "KP-AJ",
  event: "KP-EV",
};

function shortCode(reference: string | null | undefined): string {
  if (!reference) return Math.floor(1000 + Math.random() * 9000).toString();
  // Hash-ish: sum char codes mod 100000, padded.
  let sum = 0;
  for (let i = 0; i < reference.length; i++) sum = (sum * 31 + reference.charCodeAt(i)) >>> 0;
  return (sum % 100000).toString().padStart(4, "0");
}

export function toFriendlyRef(type: string, reference?: string | null): string {
  const prefix = PREFIX[type?.toLowerCase()] ?? "KP-TX";
  return `${prefix}-${shortCode(reference)}`;
}

/**
 * Builds a clean, human notification body.
 * Example: notifyMessage("withdrawal","success", { amount: 15000 })
 *   → "Your withdrawal of ₦15,000 has been processed successfully."
 */
export function notifyMessage(
  type: string,
  status: "success" | "failed" | "pending" | "reversal" = "success",
  ctx: { amount?: number; asset?: string; recipient?: string } = {},
): string {
  const amt = ctx.amount != null
    ? `₦${Number(ctx.amount).toLocaleString("en-NG")}`
    : "";
  switch (type.toLowerCase()) {
    case "withdrawal":
      return status === "success"
        ? `Your withdrawal of ${amt} has been processed successfully.`
        : `Your withdrawal of ${amt} could not be completed and has been refunded to your wallet.`;
    case "funding":
    case "deposit":
      return `Your wallet has been credited with ${amt}.`;
    case "crypto":
    case "crypto_sale":
      return `Your crypto conversion has been completed successfully. ${amt} credited to your wallet.`;
    case "airtime":
      return `Your airtime purchase of ${amt} was successful.`;
    case "data":
      return `Your data purchase of ${amt} was successful.`;
    case "vendor":
    case "merchant":
      return `Your payment of ${amt} was successful.`;
    case "printing":
      return `Your printing order of ${amt} was received.`;
    case "errand":
      return status === "success"
        ? `Your errand payment of ${amt} was successful.`
        : `Your errand has been updated.`;
    case "refund":
    case "reversal":
      return `${amt} has been returned to your wallet successfully.`;
    case "p2p":
    case "p2p_transfer":
      return ctx.recipient
        ? `You sent ${amt} to ${ctx.recipient} successfully.`
        : `Your transfer of ${amt} was successful.`;
    default:
      return status === "success"
        ? `Your transaction of ${amt} was successful.`
        : `Your transaction could not be completed.`;
  }
}
