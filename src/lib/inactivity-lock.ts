/**
 * Inactivity lock: instead of destroying the session after idle timeout, we
 * "lock" the app. The student can get back in with their fingerprint / Face ID
 * or a 6-digit email code — no password re-entry needed.
 */

const LOCK_KEY = "kuka_inactivity_locked_at";
export const LOCK_EVENT = "kuka:inactivity-lock";

// After this long locked, we drop the session entirely for safety.
export const HARD_EXPIRY_MS = 30 * 60 * 1000;

const emit = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOCK_EVENT));
  }
};

export const lockApp = () => {
  if (typeof window === "undefined") return;
  if (!sessionStorage.getItem(LOCK_KEY)) {
    sessionStorage.setItem(LOCK_KEY, String(Date.now()));
  }
  emit();
};

export const unlockApp = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LOCK_KEY);
  emit();
};

export const lockedAt = (): number | null => {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(LOCK_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const isAppLocked = (): boolean => lockedAt() !== null;

export const isLockExpired = (): boolean => {
  const at = lockedAt();
  return at !== null && Date.now() - at > HARD_EXPIRY_MS;
};
