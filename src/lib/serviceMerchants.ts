import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch active merchants on the caller's campus that either:
 *  - have `merchants.category` in `merchantCategories`, OR
 *  - have at least one `merchant_products.category` in `productCategories`.
 *
 * This bridges the two-tier taxonomy: some merchants were onboarded with a
 * generic slug (e.g. "general", "stationery") but sell printing/laundry/food
 * products. Filtering only by merchant.category would hide them.
 */
export async function fetchServiceMerchants<T extends Record<string, any>>({
  columns,
  merchantCategories,
  productCategories,
  campusId,
}: {
  columns: string;
  merchantCategories: string[];
  productCategories: string[];
  campusId?: string | null;
}): Promise<T[]> {
  // 1. Merchants matching by their own category.
  let byCat = supabase
    .from("merchants")
    .select(columns)
    .eq("status", "active")
    .in("category", merchantCategories);
  if (campusId) byCat = byCat.eq("campus_id", campusId);

  // 2. Merchant IDs that have products in the given product categories.
  const productQuery = supabase
    .from("merchant_products")
    .select("merchant_id")
    .in("category", productCategories);

  const [{ data: catRows }, { data: prodRows }] = await Promise.all([
    byCat,
    productQuery,
  ]);

  const found = new Map<string, T>();
  ((catRows ?? []) as unknown as T[]).forEach((m) => {
    if (m && m.id) found.set(m.id as string, m);
  });

  const missingIds = Array.from(
    new Set(
      (prodRows ?? [])
        .map((r: any) => r.merchant_id as string)
        .filter((id) => id && !found.has(id)),
    ),
  );

  if (missingIds.length > 0) {
    let extras = supabase
      .from("merchants")
      .select(columns)
      .eq("status", "active")
      .in("id", missingIds);
    if (campusId) extras = extras.eq("campus_id", campusId);
    const { data: extraRows } = await extras;
    ((extraRows ?? []) as unknown as T[]).forEach((m) => {
      if (m && m.id) found.set(m.id as string, m);
    });
  }

  return Array.from(found.values()).sort((a: any, b: any) =>
    String(a.business_name || "").localeCompare(String(b.business_name || "")),
  );
}
