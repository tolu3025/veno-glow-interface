import { useEffect, useState } from "react";
import { Smartphone, X, ArrowUpRight } from "lucide-react";
import {
  isStandalone,
  isPwaInstalledMarker,
  isBannerDismissed,
  dismissBanner,
  markPwaInstalled,
  isIos,
  openInstalledApp,
} from "@/lib/pwa";
import { useNavigate } from "react-router-dom";

type Mode = "hidden" | "open-app" | "install";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Slim banner shown above app content:
 * - "open-app": the user has KukaPay installed (marker set by the standalone
 *   app) but is browsing in a normal tab — offer to jump to the app.
 * - "install": the browser fired beforeinstallprompt — offer one-tap install.
 */
const OpenInAppBanner = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("hidden");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Running installed? Record it and never show a banner inside the app.
    if (isStandalone()) {
      markPwaInstalled();
      return;
    }

    // iOS-only footprint: Android users have the native Capacitor app, and
    // desktop browsers don't need the prompt.
    if (!isIos()) return;

    if (isPwaInstalledMarker() && !isBannerDismissed()) {
      setMode("open-app");
      return;
    }

    // iOS: no install popup — users add it via Safari's Share → Add to Home
    // Screen; the apple-* head tags make it open as a full-screen app.

    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (isBannerDismissed()) return;
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setMode((m) => (m === "hidden" ? "install" : m));
    };
    const onInstalled = () => {
      markPwaInstalled();
      setMode("hidden");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  const close = () => {
    dismissBanner();
    setMode("hidden");
  };

  const handleOpen = () => {
    if (!openInstalledApp()) {
      // iOS/other: no programmatic way to launch the home-screen app.
      navigate("/install");
    }
    close();
  };

  const handleInstall = async () => {
    if (!installPrompt) {
      // iOS: no programmatic prompt — show the guided instructions.
      navigate("/install");
      close();
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") markPwaInstalled();
    setInstallPrompt(null);
    setMode("hidden");
  };

  return (
    <div className="fixed inset-x-3 top-3 z-[9990] flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Smartphone className="h-4.5 w-4.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {mode === "open-app" ? "You have the KukaPay app" : "Get the KukaPay app"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {mode === "open-app"
            ? "Open it from your home screen."
            : "Add it to your home screen for instant access."}
        </p>
      </div>
      {mode === "open-app" ? (
        <button
          type="button"
          onClick={handleOpen}
          className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Open <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Install
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={close}
        className="shrink-0 rounded-full p-1 text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default OpenInAppBanner;
