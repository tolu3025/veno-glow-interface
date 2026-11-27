// Airtime and data cashback, credited once per purchase reference.
export const CASHBACK_RATE = 0.02;

export function cashbackKobo(amountNaira: number): number {
  return Math.floor(Math.round(amountNaira * 100) * CASHBACK_RATE);
}

// deno-lint-ignore no-explicit-any
export async function grantCashback(supabase: any, userId: string, reference: string, amountNaira: number, purchaseType: "airtime" | "data"): Promise<number> {
  const kobo = cashbackKobo(amountNaira);
  if (kobo <= 0) return 0;
  const ref = `CB-${reference}`;
  try {
    const { data: post } = await supabase.rpc("post_ledger_entry", {
      _debit_user_id: null, _credit_user_id: userId, _amount_kobo: kobo,
      _purpose: "cashback", _reference: ref,
      _metadata: { source_reference: reference, purchase_type: purchaseType, rate: CASHBACK_RATE },
      _external_kind: "platform_fee",
    });
    if (!post?.success) { console.error("[cashback] not posted", post); return 0; }
    const naira = kobo / 100;
    await supabase.from("transactions").insert({
      user_id: userId, type: "deposit", amount: naira, status: "completed", reference: ref,
      metadata: { direction: "credit", kind: "cashback", source_reference: reference, purchase_type: purchaseType },
    });
    await supabase.rpc("create_notification", {
      p_user_id: userId, p_title: "Cashback received",
      p_message: `You earned ₦${naira.toLocaleString()} cashback on your ${purchaseType} purchase.`,
      p_type: "cashback", p_metadata: { reference: ref, amount: naira },
    });
    return naira;
  } catch (e) { console.error("[cashback] error", e); return 0; }
}
