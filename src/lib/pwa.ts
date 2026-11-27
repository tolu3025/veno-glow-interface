// PWA install/open helpers.
// KukaPay is an installable PWA. When it runs installed (standalone), we drop a
// localStorage marker. The same browser profile shares that storage with normal
// tabs, so when the user later opens the site in a browser tab we can offer to
// hand them over to the installed app.

export const PWA_INSTALLED_KEY = "kukapay-pwa-installed";
export const PWA_BANNER_DISMISSED_KEY = "kukapay-open-app-dismissed";
const DISMISS_DAYS = 7;

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (navigator as any).standalone === true
  );
}

export function markPwaInstalled() {
  try {
    localStorage.setItem(PWA_INSTALLED_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

export function isPwaInstalledMarker(): boolean {
  try {
    return localStorage.getItem(PWA_INSTALLED_KEY) !== null;
  } catch {
    return false;
  }
}

export function isBannerDismissed(): boolean {
  try {
    const until = Number(localStorage.getItem(PWA_BANNER_DISMISSED_KEY) || 0);
    return until > Date.now();
  } catch {
    return false;
  }
}

export function dismissBanner() {
  try {
    localStorage.setItem(
      PWA_BANNER_DISMISSED_KEY,
      String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
    );
  } catch {
    /* storage unavailable */
  }
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * iPhone / iPad / iPod detection. iPadOS 13+ reports as "MacIntel", so we
 * also check for a multi-touch Mac. Android is intentionally excluded:
 * Android users get the native Capacitor app, so the install/open banner is
 * an iOS-only footprint.
 */
export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/**
 * Best-effort deep link into the installed PWA.
 * On Android, Chrome-generated WebAPKs register intent filters for their
 * scope, so an intent:// URL opens the standalone app; the browser stays put
 * via the fallback URL if the app isn't there. On iOS there is no way to
 * programmatically open a home-screen web app, so callers should fall back to
 * guidance (the /install page).
 */
export function openInstalledApp(): boolean {
  if (typeof window === "undefined") return false;
  const origin = window.location.origin;
  if (isAndroid()) {
    const fallback = encodeURIComponent(`${origin}/`);
    window.location.href = `intent://${origin.replace(/^https?:\/\//, "")}/#Intent;scheme=https;S.browser_fallback_url=${fallback};end`;
    return true;
  }
  return false;
}
