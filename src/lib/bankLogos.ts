/**
 * Nigerian bank logo lookup.
 * Sourced from the public nigerianbanks.xyz dataset which exposes a JSON list
 * of banks with `name`, `code`, `slug`, and `logo` URLs.
 *
 * We fetch the list once per session, cache it, and provide a fallback that
 * derives the logo URL from a slugified bank name when the bank is missing
 * from the dataset.
 */

export interface BankInfo {
  name: string;
  code: string;
  slug: string;
  logo: string;
}

const LIST_URL = "https://nigerianbanks.xyz/";
const LOGO_BASE = "https://nigerianbanks.xyz/logo";

let cache: BankInfo[] | null = null;
let inflight: Promise<BankInfo[]> | null = null;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function deriveBankLogoUrl(name: string): string {
  return `${LOGO_BASE}/${slugify(name)}.png`;
}

export async function loadBanks(): Promise<BankInfo[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch(LIST_URL)
    .then((r) => (r.ok ? r.json() : []))
    .then((data: any[]) => {
      cache = Array.isArray(data) ? data : [];
      return cache;
    })
    .catch(() => {
      cache = [];
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Resolve a logo URL by bank code or name. Returns a derived URL as fallback
 * so callers always get a usable string (image may 404, which is fine).
 */
export async function getBankLogoUrl(opts: { code?: string; name?: string }): Promise<string> {
  const banks = await loadBanks();
  const code = opts.code?.trim();
  const name = opts.name?.trim();

  if (code) {
    const hit = banks.find((b) => b.code === code);
    if (hit?.logo) return hit.logo;
  }
  if (name) {
    const lower = name.toLowerCase();
    const hit = banks.find(
      (b) => b.name.toLowerCase() === lower || b.name.toLowerCase().includes(lower),
    );
    if (hit?.logo) return hit.logo;
    return deriveBankLogoUrl(name);
  }
  return "";
}

/** Synchronous best-effort using the in-memory cache (no network). */
export function getBankLogoUrlSync(opts: { code?: string; name?: string }): string {
  const code = opts.code?.trim();
  const name = opts.name?.trim();
  if (cache) {
    if (code) {
      const hit = cache.find((b) => b.code === code);
      if (hit?.logo) return hit.logo;
    }
    if (name) {
      const lower = name.toLowerCase();
      const hit = cache.find(
        (b) => b.name.toLowerCase() === lower || b.name.toLowerCase().includes(lower),
      );
      if (hit?.logo) return hit.logo;
    }
  }
  return name ? deriveBankLogoUrl(name) : "";
}
