import { expect, test } from "bun:test";
import { cashbackKobo, CASHBACK_RATE } from "../../supabase/functions/_shared/cashback";

test("cashback is 2% for airtime and data", () => {
  expect(CASHBACK_RATE).toBe(0.02);
  expect(cashbackKobo(1000)).toBe(2000); // ₦20 on ₦1,000
  expect(cashbackKobo(100)).toBe(200); // ₦2 on ₦100
});
