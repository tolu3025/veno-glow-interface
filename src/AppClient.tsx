import { useEffect, useState, lazy, Suspense } from "react";
import KukaPayLoader from "@/components/shared/KukaPayLoader";
import ErrorBoundary from "@/components/ErrorBoundary";
import posthog from "posthog-js";

const App = lazy(() => import("./App"));

function BootFallback() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 12_000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <KukaPayLoader isLoading label="Loading KukaPay…" />
      {timedOut && (
        <div className="fixed inset-x-4 bottom-4 z-[10000] rounded-2xl border border-border bg-background p-4 text-center shadow-lg">
          <p className="text-sm font-semibold text-foreground">Still loading?</p>
          <p className="mt-1 text-xs text-muted-foreground">Refresh to clear an old cached app shell.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 h-10 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            Refresh app
          </button>
        </div>
      )}
    </>
  );
}

export default function KukaPayApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initialize PostHog
    if (typeof window !== "undefined") {
      const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
      const posthogHost = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
      if (posthogKey) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          person_profiles: "identified_only",
        });
      }
    }

    // Global error capture — so future blank-screen issues leave a signal.
    const onError = (e: ErrorEvent) => console.error("[window.error]", e.error ?? e.message);
    const onRejection = (e: PromiseRejectionEvent) =>
      console.error("[unhandledrejection]", e.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    // Proactively unregister any stale service workers from previous builds.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations?.().then((regs) => {
        regs.forEach((r) => {
          // Re-register /sw.js so the kill-switch runs, then it self-unregisters.
          if (r.active && !r.active.scriptURL.endsWith("/sw.js")) {
            r.unregister().catch(() => {});
          }
        });
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!mounted) {
    return <KukaPayLoader isLoading label="Loading KukaPay…" />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<BootFallback />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  );
}
