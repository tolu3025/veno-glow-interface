import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { amountToKobo, verifyMonnifySignature } from "./monnify-deposit";

describe("monnify deposits", () => {
  test("converts naira to kobo", () => {
    expect(amountToKobo(1500)).toBe(150000);
    expect(amountToKobo("2000.50")).toBe(200050);
    expect(() => amountToKobo(0)).toThrow();
  });
  test("accepts only the correct signature", async () => {
    const raw = '{"eventType":"SUCCESSFUL_TRANSACTION"}';
    const sig = createHmac("sha512", "s3cret").update(raw).digest("hex");
    expect(await verifyMonnifySignature(raw, sig, "s3cret")).toBe(true);
    expect(await verifyMonnifySignature(raw + " ", sig, "s3cret")).toBe(false);
    expect(await verifyMonnifySignature(raw, sig, "other")).toBe(false);
  });
});
