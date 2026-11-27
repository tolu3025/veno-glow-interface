import { describe, expect, test } from "bun:test";
import { squadWithdrawalQuote, squadCollectionPayoutQuote, collectionContributorFee } from "./squad-fees";

describe("Agreed Squad target prices (not live until cutover)", () => {
  test("normal withdrawals retain the ₦1,000 minimum", () => {
    expect(() => squadWithdrawalQuote(999)).toThrow();
    expect(squadWithdrawalQuote(1_000).fee).toBe(15);
  });
  test("₦1,000–₦3,000 costs ₦15", () => {
    expect(squadWithdrawalQuote(1_000).fee).toBe(15);
    expect(squadWithdrawalQuote(3_000).fee).toBe(15);
  });
  test("above ₦3,000 and below ₦10,000 costs ₦35", () => {
    expect(squadWithdrawalQuote(3_000.01).fee).toBe(35);
    expect(squadWithdrawalQuote(9_999.99).fee).toBe(35);
  });
  test("₦10,000+ costs 2% plus ₦50", () => {
    expect(squadWithdrawalQuote(10_000).fee).toBe(250);
    expect(squadWithdrawalQuote(50_000).fee).toBe(1_050);
  });
  test("normal withdrawal fee is capped at ₦1,500", () => {
    expect(squadWithdrawalQuote(150_000).fee).toBe(1_500);
    expect(squadWithdrawalQuote(200_000).fee).toBe(1_500);
  });
  test("bank receives full amount; fee comes from wallet on top", () => {
    expect(squadWithdrawalQuote(3_000)).toEqual({ amount: 3_000, fee: 15, totalDebit: 3_015, bankReceives: 3_000 });
  });
  test("verified collection payouts cost reps ₦0", () => {
    expect(squadCollectionPayoutQuote(150_000)).toEqual({ amount: 150_000, fee: 0, totalDebit: 150_000, bankReceives: 150_000 });
    expect(squadCollectionPayoutQuote(200_000).fee).toBe(0);
  });
  test("external collection contributors pay ₦50 flat", () => {
    expect(collectionContributorFee("external_bank")).toBe(50);
  });
  test("KukaPay wallet collection contributors pay ₦0", () => {
    expect(collectionContributorFee("kukapay_wallet")).toBe(0);
  });
  test("invalid or sub-kobo amounts cannot enter fee calculation", () => {
    for (const amount of [NaN, Infinity, 1_000.001]) expect(() => squadWithdrawalQuote(amount)).toThrow();
  });
});