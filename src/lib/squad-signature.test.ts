import { expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { verifySquadWebhookSignature } from "./squad-signature";

const fixtureKey = "squad-unit-test-key-not-a-real-credential";
const body = '{"transaction_reference":"fixture-deposit","currency":"NGN"}';
const signature = createHmac("sha512", fixtureKey).update(body).digest("hex");

test("accepts valid Squad SHA512 signatures in either hex casing", async () => {
  expect(await verifySquadWebhookSignature(body, signature, fixtureKey)).toBe(true);
  expect(await verifySquadWebhookSignature(body, signature.toUpperCase(), fixtureKey)).toBe(true);
});
test("rejects tampered webhook bodies", async () => {
  expect(await verifySquadWebhookSignature(body.replace("NGN", "USD"), signature, fixtureKey)).toBe(false);
});
test("rejects unsigned, malformed, and wrong-key webhooks", async () => {
  expect(await verifySquadWebhookSignature(body, null, fixtureKey)).toBe(false);
  expect(await verifySquadWebhookSignature(body, "0".repeat(128), fixtureKey)).toBe(false);
  expect(await verifySquadWebhookSignature(body, "z".repeat(128), fixtureKey)).toBe(false);
  expect(await verifySquadWebhookSignature(body, signature, "wrong-fixture-key")).toBe(false);
  expect(await verifySquadWebhookSignature(body, signature, "")).toBe(false);
});
test("signature covers raw bytes, not reserialized JSON", async () => {
  expect(await verifySquadWebhookSignature(JSON.stringify(JSON.parse(body), null, 2), signature, fixtureKey)).toBe(false);
});