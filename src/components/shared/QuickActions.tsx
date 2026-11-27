import { Plus, Send, ArrowDownLeft, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  icon: LucideIcon;
  path: string;
  variant: "primary" | "accent" | "neutral";
}

const ACTIONS: Action[] = [
  { label: "Add Money", icon: Plus,         path: "/add-money", variant: "primary" },
  { label: "Send",      icon: Send,         path: "/send",      variant: "accent"  },
  { label: "Request",   icon: ArrowDownLeft,path: "/collect",   variant: "neutral" },
];

const TONE: Record<Action["variant"], string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  accent:  "bg-accent text-accent-foreground hover:bg-accent/90",
  neutral: "bg-card text-foreground border border-border hover:bg-muted/60",
};

export const QuickActions = () => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {ACTIONS.map((a) => (
        <button
          key={a.label}
          onClick={() => navigate(a.path)}
          className={cn(
            "h-12 rounded-full flex items-center justify-center gap-1.5",
            "text-[13px] font-semibold press-scale shadow-soft",
            TONE[a.variant],
          )}
        >
          <a.icon className="h-4 w-4" strokeWidth={1.7} />
          {a.label}
        </button>
      ))}
    </div>
  );
};
