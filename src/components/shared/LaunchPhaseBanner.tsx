import { useEffect, useState } from "react";
import { Rocket, X } from "lucide-react";
import { MIN_DEPOSIT } from "@/lib/constants";

const STORAGE_KEY = "kukapay-launch-banner-dismissed-v2";

export const LaunchPhaseBanner = () => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setDismissed(true);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/15 p-4 shadow-sm">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-2xl"
        aria-hidden
      />
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss launch notice"
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
          <Rocket className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Campus Launch Phase Active
          </p>
          <p className="text-[13px] leading-snug text-foreground">
            Send unlimited transfers within KukaPay nationwide.
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Minimum deposit is ₦{MIN_DEPOSIT.toLocaleString()}. External withdrawals are gradually unlocking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LaunchPhaseBanner;
