import { describe, expect, test } from "bun:test";
import { withdrawalBreakdown, maxWithdrawableFor } from "./fees";

describe("student withdrawal fees", () => {
  test("₦1,000–₦3,000 costs ₦15", () => {
    expect(withdrawalBreakdown(1000).totalCharges).toBe(15);
    expect(withdrawalBreakdown(3000).totalCharges).toBe(15);
  });
  test("₦3,001–₦9,999 costs ₦35", () => {
    expect(withdrawalBreakdown(3001).totalCharges).toBe(35);
    expect(withdrawalBreakdown(9999).totalCharges).toBe(35);
  });
  test("₦10,000+ costs 2% + ₦50", () => {
    expect(withdrawalBreakdown(10000).totalCharges).toBe(250);
  });
  test("fee capped at ₦1,500", () => {
    expect(withdrawalBreakdown(500000).totalCharges).toBe(1500);
  });
  test("bank receives exact amount, fee on top", () => {
    const b = withdrawalBreakdown(2000);
    expect(b.netReceive).toBe(2000);
    expect(b.totalDebit).toBe(2015);
  });
  test("max withdrawable fits balance", () => {
    expect(maxWithdrawableFor(2015)).toBe(2000);
  });
});
