import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { lockApp, isAppLocked } from "@/lib/inactivity-lock";

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const WARNING_MS = 4 * 60 * 1000; // 4 minutes - show warning (1 min before logout)
const EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "mousemove", "click"];

const useSessionTimeout = () => {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const warningRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [showWarning, setShowWarning] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  const handleTimeout = useCallback(() => {
    if (!user) return;
    setShowWarning(false);
    if (isAppLocked()) return;
    toast.info("Locked after 5 minutes of inactivity. Unlock with your fingerprint or an email code.", {
      duration: 5000,
    });
    lockApp();
  }, [user]);

  const handleWarning = useCallback(() => {
    if (!user || isAppLocked()) return;
    setShowWarning(true);
    toast.warning("You'll be logged out in 1 minute due to inactivity.", {
      duration: 15000,
      action: {
        label: "Stay Logged In",
        onClick: () => {
          setShowWarning(false);
          resetTimer();
        },
      },
    });
  }, [user]);

  const resetTimer = useCallback(() => {
    if (warningRef.current) clearTimeout(warningRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowWarning(false);
    lastActivityRef.current = Date.now();

    warningRef.current = setTimeout(handleWarning, WARNING_MS);
    timerRef.current = setTimeout(handleTimeout, TIMEOUT_MS);
  }, [handleTimeout, handleWarning]);

  // Visibility change handler — check elapsed time when user returns to tab
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible" && user) {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= TIMEOUT_MS) {
        handleTimeout();
      } else if (elapsed >= WARNING_MS) {
        handleWarning();
      }
      // Otherwise just reset the timer from where we are
    }
  }, [user, handleTimeout, handleWarning]);

  useEffect(() => {
    if (!user) return;

    resetTimer();

    const handler = () => resetTimer();
    EVENTS.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      EVENTS.forEach((e) => window.removeEventListener(e, handler));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, resetTimer, handleVisibilityChange]);

  return { showWarning };
};

export default useSessionTimeout;
