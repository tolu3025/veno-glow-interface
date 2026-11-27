import { Sparkles } from "lucide-react";

/**
 * Explains that the "Request" quick action creates a money collection.
 * Shown on the dashboard, right where recent merchant suggestions live.
 */
export const CollectionInfoBanner = () => (
  <div className="rounded-2xl p-4 bg-grad-collections shadow-soft flex items-start gap-3">
    <div className="h-10 w-10 rounded-full bg-background/40 flex items-center justify-center shrink-0">
      <Sparkles className="h-5 w-5" strokeWidth={1.8} />
    </div>
    <div className="min-w-0">
      <p className="font-bold text-sm">"Request" means collect money</p>
      <p className="text-xs text-foreground/70 mt-0.5">
        Tap Request above to create a collection — dues, contributions, group payments. Each one
        gets its own link and account number.
      </p>
    </div>
  </div>
);

export default CollectionInfoBanner;
