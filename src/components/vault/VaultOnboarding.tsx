import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Vault, TrendingDown, ShieldAlert } from "lucide-react";

const SLIDES = [
  {
    icon: TrendingDown,
    title: "Beat Naira depreciation 📉",
    body: "The Naira has lost value against the dollar every year. Save in USD to protect what you have.",
    accent: "bg-grad-activity",
  },
  {
    icon: Vault,
    title: "Lock it. Grow it. 🔒",
    body: "Pick a challenge — 7, 30, 90, 180 or 365 days. Your dollars stay safe until the challenge ends.",
    accent: "bg-grad-collections",
  },
  {
    icon: ShieldAlert,
    title: "Honest disclaimer ⚠️",
    body: "KukaPay doesn't pay interest. Your gain comes from Naira weakening. Rates can move either way — no guaranteed return.",
    accent: "bg-grad-ajo",
  },
];

export function VaultOnboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const Icon = s.icon;
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className={`h-40 w-40 rounded-[32px] ${s.accent} flex items-center justify-center shadow-soft-lg`}>
          <Icon className="h-16 w-16 text-foreground" strokeWidth={1.4} />
        </div>
        <h2 className="text-2xl font-bold tracking-tightish max-w-xs">{s.title}</h2>
        <p className="text-muted-foreground max-w-xs leading-relaxed">{s.body}</p>
      </div>
      <div className="flex gap-2 justify-center mb-6">
        {SLIDES.map((_, idx) => (
          <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-1.5 bg-muted"}`} />
        ))}
      </div>
      <div className="flex gap-3">
        {i > 0 && <Button variant="outline" className="flex-1" onClick={() => setI(i - 1)}>Back</Button>}
        <Button
          className="flex-1"
          onClick={() => {
            if (i < SLIDES.length - 1) setI(i + 1);
            else {
              localStorage.setItem("kuka_vault_onboarded_v1", "1");
              onDone();
            }
          }}
        >
          {i < SLIDES.length - 1 ? "Next" : "I understand"}
        </Button>
      </div>
    </div>
  );
}
