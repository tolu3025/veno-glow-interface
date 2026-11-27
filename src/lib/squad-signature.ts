/** Squad signature validation; no environment access, safe to test in isolation. */
export async function verifySquadWebhookSignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!secret || !signature || !/^[a-f\d]{128}$/i.test(signature)) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody)));
  const expected = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  let mismatch = 0;
  const normalized = signature.toLowerCase();
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ normalized.charCodeAt(i);
  return mismatch === 0;
}