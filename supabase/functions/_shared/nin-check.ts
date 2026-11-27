// Shared NIN identity check.
//
// A virtual account must never be issued against a NIN that does not exist or
// belongs to somebody else — Flutterwave happily issues an account for a wrong
// NIN (the sender then just sees "Kukapay"), so we validate first.

const YV_BASE = "https://api.youverify.co";

export type NinCheckStatus = "match" | "mismatch" | "not_found" | "unavailable";

export interface NinCheckResult {
  status: NinCheckStatus;
  /** Name returned by the identity database, when available. */
  name: string | null;
  /** Human readable reason, safe to show a user. */
  message: string;
}

function normalize(s: string): string[] {
  return (s || "").toLowerCase().replace(/[^a-z\s]/g, " ").trim().split(/\s+/).filter(Boolean);
}

export function namesMatch(profileName: string, identityName: string): boolean {
  const a = normalize(profileName);
  const b = normalize(identityName);
  if (!a.length || !b.length) return false;
  const hits = a.filter((p) => b.some((n) => n === p || (p.length > 3 && n.includes(p)) || (n.length > 3 && p.includes(n))));
  return hits.length >= Math.min(2, a.length);
}

/**
 * Look the NIN up and compare it to the profile name.
 * `unavailable` means we could not reach the identity provider — callers decide
 * whether to proceed (we do, to avoid a provider outage blocking every user).
 */
export async function checkNin(nin: string, profileFullName: string): Promise<NinCheckResult> {
  const digits = (nin || "").replace(/\D/g, "");
  if (digits.length !== 11) {
    return { status: "not_found", name: null, message: "The NIN provided is not a valid 11-digit number." };
  }

  const token = Deno.env.get("YOUVERIFY_API_TOKEN");
  if (!token) {
    return { status: "unavailable", name: null, message: "Identity check service is not configured." };
  }

  let res: Response;
  let json: any = {};
  try {
    res = await fetch(`${YV_BASE}/v2/api/identity/ng/nin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify({ id: digits, isSubjectConsent: true }),
    });
    const text = await res.text();
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
  } catch (e) {
    console.error("[nin-check] network error:", e);
    return { status: "unavailable", name: null, message: "Could not reach the identity database." };
  }

  if (res.status === 404 || json?.statusCode === 404 || /not\s*found/i.test(json?.message || "")) {
    return { status: "not_found", name: null, message: "This NIN was not found in the national database." };
  }

  if (!res.ok || json?.success === false || !json?.data) {
    console.error("[nin-check] lookup failed:", res.status, JSON.stringify(json).slice(0, 500));
    return { status: "unavailable", name: null, message: "Identity database did not respond." };
  }

  const d = json.data ?? {};
  const identityName = [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ").trim();
  if (!identityName) {
    return { status: "unavailable", name: null, message: "Identity database returned no name." };
  }

  if (!namesMatch(profileFullName, identityName)) {
    return {
      status: "mismatch",
      name: identityName,
      message: "The name on this NIN does not match the name on the KukaPay profile.",
    };
  }

  return { status: "match", name: identityName, message: "NIN verified." };
}
