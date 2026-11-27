import { afterEach, expect, test } from "bun:test";
import { squadRequest } from "./squad-http.server";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const base = "https://sandbox-api-d.squadco.com";
const fixtureKey = "not-a-real-squad-key";

test("returns a plain DTO for successful provider responses", async () => {
  globalThis.fetch = Object.assign(async () => Response.json({ success: true, data: { account_name: "Fixture User" } }), { preconnect: originalFetch.preconnect });
  expect(await squadRequest(base, "/payout/account/lookup", fixtureKey)).toEqual({ kind: "success", httpStatus: 200, data: { account_name: "Fixture User" } });
});
test("does not retry ambiguous payouts after network failure", async () => {
  let calls = 0;
  globalThis.fetch = Object.assign(async () => { calls++; throw new Error("Network timeout"); }, { preconnect: originalFetch.preconnect });
  expect((await squadRequest(base, "/payout/transfer", fixtureKey, { method: "POST", body: {} })).kind).toBe("unknown");
  expect(calls).toBe(1);
});
test("gateway failure and malformed success are unknown, not refundable failures", async () => {
  globalThis.fetch = Object.assign(async () => new Response("gateway error", { status: 502 }), { preconnect: originalFetch.preconnect });
  expect((await squadRequest(base, "/payout/transfer", fixtureKey)).kind).toBe("unknown");
  globalThis.fetch = Object.assign(async () => Response.json({ message: "unexpected" }), { preconnect: originalFetch.preconnect });
  expect((await squadRequest(base, "/payout/transfer", fixtureKey)).kind).toBe("unknown");
});
test("explicit HTTP rejection remains distinct from unknown results", async () => {
  globalThis.fetch = Object.assign(async () => Response.json({ success: false }, { status: 400 }), { preconnect: originalFetch.preconnect });
  expect((await squadRequest(base, "/payout/account/lookup", fixtureKey)).kind).toBe("rejected");
});
test("credentials cannot be sent to another host or redirected URL", async () => {
  let calls = 0;
  globalThis.fetch = Object.assign(async () => { calls++; return Response.json({}); }, { preconnect: originalFetch.preconnect });
  await expect(squadRequest("https://example.com", "/payout/transfer", fixtureKey)).rejects.toThrow();
  await expect(squadRequest(base, "//example.com", fixtureKey)).rejects.toThrow();
  await expect(squadRequest(base, "/payout/transfer", "")).rejects.toThrow();
  expect(calls).toBe(0);
});