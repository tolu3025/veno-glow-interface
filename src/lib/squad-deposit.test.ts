import { expect, test } from "bun:test";
import { matchesVerifiedDeposit, nairaToKobo, signatureInput, squadActivationSchema, squadDepositSchema } from "./squad-deposit";

const deposit = squadDepositSchema.parse({ transaction_reference: "fixture-001", virtual_account_number: "2224449991", customer_identifier: "fixture-student", principal_amount: "1050.00", settled_amount: "1037.00", currency: "NGN", transaction_indicator: "C", channel: "virtual-account" });
const verified = { ...deposit, froze_transaction: null, customer: { customer_identifier: deposit.customer_identifier } };

test("NGN decimal conversion preserves the full student deposit in kobo", () => {
  expect(nairaToKobo(deposit.principal_amount)).toBe(105000);
  expect(nairaToKobo("1000.01")).toBe(100001);
  expect(() => nairaToKobo("0.00")).toThrow();
});
test("only matching authoritative deposits with an explicit unfrozen state pass", () => {
  expect(matchesVerifiedDeposit(deposit, verified)).toBe(true);
  expect(matchesVerifiedDeposit(deposit, { ...verified, froze_transaction: undefined })).toBe(false);
  expect(matchesVerifiedDeposit(deposit, { ...verified, frozen_transaction: { reason: "under review" } })).toBe(false);
});
test("settled amount must match and be positive", () => {
  expect(matchesVerifiedDeposit(deposit, { ...verified, settled_amount: "1036.00" })).toBe(false);
  expect(matchesVerifiedDeposit(deposit, { ...verified, settled_amount: "0.00" })).toBe(false);
});
test("deposits cannot be credited to a different student or account", () => {
  expect(matchesVerifiedDeposit(deposit, { ...verified, customer_identifier: "another-student" })).toBe(false);
  expect(matchesVerifiedDeposit(deposit, { ...verified, virtual_account_number: "2224449992" })).toBe(false);
  expect(matchesVerifiedDeposit(deposit, { ...verified, transaction_reference: "different-ref" })).toBe(false);
});
test("version one signatures preserve raw body; later versions include both amounts", () => {
  expect(signatureInput("raw-fixture", deposit)).toBe("raw-fixture");
  expect(signatureInput("raw-fixture", { ...deposit, version: "v3" })).toBe("fixture-001|2224449991|NGN|1050.00|1037.00|fixture-student");
  expect(() => signatureInput("raw-fixture", { ...deposit, version: "v4" })).toThrow();
});
test("account activation requires eleven BVN digits and a real past birth date", () => {
  const input = { bvn: "12345678901", dob: "2000-02-29", gender: "1", address: "Fixture student address" };
  expect(squadActivationSchema.safeParse(input).success).toBe(true);
  expect(squadActivationSchema.safeParse({ ...input, bvn: "1234567890" }).success).toBe(false);
  expect(squadActivationSchema.safeParse({ ...input, dob: "2001-02-29" }).success).toBe(false);
  expect(squadActivationSchema.safeParse({ ...input, dob: "2999-01-01" }).success).toBe(false);
});