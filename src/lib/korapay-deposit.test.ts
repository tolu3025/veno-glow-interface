import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import {
  amountToKobo,
  verifyKorapaySignature,
  korapayPayoutOutcome,
} from "./korapay-deposit";

describe("korapay deposits", () => {
  test("converts naira to kobo correctly", () => {
    expect(amountToKobo(1500)).toBe(150000);
    expect(amountToKobo("2000.50")).toBe(200050);
    expect(amountToKobo(1000)).toBe(100000);
    expect(() => amountToKobo(0)).toThrow("Invalid NGN amount");
    expect(() => amountToKobo(-100)).toThrow("Invalid NGN amount");
    expect(() => amountToKobo("abc")).toThrow("Invalid NGN amount");
  });

  test("accepts only the correct HMAC-SHA256 signature", async () => {
    const raw = '{"event":"charge.success","data":{"reference":"KP-123"}}';
    const sig = createHmac("sha256", "kora_sk_test_secret")
      .update(raw)
      .digest("hex");
    expect(await verifyKorapaySignature(raw, sig, "kora_sk_test_secret")).toBe(
      true,
    );
    // Wrong body
    expect(
      await verifyKorapaySignature(raw + " ", sig, "kora_sk_test_secret"),
    ).toBe(false);
    // Wrong secret
    expect(await verifyKorapaySignature(raw, sig, "other_secret")).toBe(false);
    // Null signature
    expect(await verifyKorapaySignature(raw, null, "kora_sk_test_secret")).toBe(
      false,
    );
    // Empty secret
    expect(await verifyKorapaySignature(raw, sig, "")).toBe(false);
  });

  test("rejects signature with different algorithm (SHA-512 sig vs SHA-256 expected)", async () => {
    const raw = '{"event":"charge.success"}';
    const wrongAlgoSig = createHmac("sha512", "kora_sk_test_secret")
      .update(raw)
      .digest("hex");
    // Length differs (128 hex vs 64 hex), so our length check catches it
    expect(
      await verifyKorapaySignature(raw, wrongAlgoSig, "kora_sk_test_secret"),
    ).toBe(false);
  });
});

describe("korapay payout outcome matching", () => {
  const expected = {
    reference: "KP-WD-abc123",
    amountKobo: 500000,
    bankCode: "058",
    accountNumber: "0123456789",
  };

  test("returns completed on success status", () => {
    const result = korapayPayoutOutcome(
      {
        reference: "KP-WD-abc123",
        status: "success",
        amount: 5000,
        currency: "NGN",
        recipient: { account_number: "0123456789", bank_code: "058" },
        transaction_id: "TXN-999",
      },
      expected,
    );
    expect(result?.outcome).toBe("completed");
    expect(result?.providerReference).toBe("TXN-999");
  });

  test("returns refunded on failed status", () => {
    const result = korapayPayoutOutcome(
      {
        reference: "KP-WD-abc123",
        status: "failed",
        amount: 5000,
        currency: "NGN",
      },
      expected,
    );
    expect(result?.outcome).toBe("refunded");
  });

  test("returns processing on pending/processing status", () => {
    const result = korapayPayoutOutcome(
      {
        reference: "KP-WD-abc123",
        status: "processing",
        amount: 5000,
        currency: "NGN",
      },
      expected,
    );
    expect(result?.outcome).toBe("processing");
  });

  test("returns null on reference mismatch", () => {
    const result = korapayPayoutOutcome(
      {
        reference: "WRONG-REF",
        status: "success",
        amount: 5000,
        currency: "NGN",
      },
      expected,
    );
    expect(result).toBeNull();
  });

  test("returns null on amount mismatch", () => {
    const result = korapayPayoutOutcome(
      {
        reference: "KP-WD-abc123",
        status: "success",
        amount: 9999, // wrong
        currency: "NGN",
      },
      expected,
    );
    expect(result).toBeNull();
  });

  test("returns null on bank code mismatch when recipient present", () => {
    const result = korapayPayoutOutcome(
      {
        reference: "KP-WD-abc123",
        status: "success",
        amount: 5000,
        currency: "NGN",
        recipient: { account_number: "0123456789", bank_code: "033" }, // wrong bank
      },
      expected,
    );
    expect(result).toBeNull();
  });
});
