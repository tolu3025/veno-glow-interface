import {
  RefreshCcw, Briefcase, Smartphone, Calendar, Store, Coins, PiggyBank, Grid3x3,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Shortcut {
  label: string;
  icon: LucideIcon;
  path: string;
  tint: "primary" | "accent";
}

const SHORTCUTS: Shortcut[] = [
  { label: "Ajo", icon: RefreshCcw, path: "/ajo", tint: "primary" },
  { label: "Errands", icon: Briefcase, path: "/errands", tint: "accent" },
  { label: "Airtime", icon: Smartphone, path: "/airtime", tint: "primary" },
  { label: "Events", icon: Calendar, path: "/events", tint: "accent" },
  { label: "Merchants", icon: Store, path: "/merchants", tint: "primary" },
  { label: "Convert", icon: Coins, path: "/wallet/convert-crypto", tint: "accent" },
  { label: "Savings", icon: PiggyBank, path: "/savings", tint: "primary" },
  { label: "More", icon: Grid3x3, path: "/services", tint: "accent" },
];

export const ShortcutGrid = () => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {SHORTCUTS.map((s) => (
        <button
          key={s.label}
          onClick={() => navigate(s.path)}
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-muted/60 hover:bg-muted active:scale-95 transition-all"
        >
          <div
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center",
              s.tint === "primary" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"
            )}
          >
            <s.icon className="h-4.5 w-4.5" strokeWidth={2.2} />
          </div>
          <span className="text-[11px] font-medium text-foreground/90 leading-none">{s.label}</span>
        </button>
      ))}
    </div>
  );
};
