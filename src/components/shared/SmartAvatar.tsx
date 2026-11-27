import {
  Store, Coffee, Car, Tv, Receipt, ShoppingBag, Briefcase, Zap,
  Smartphone, Calendar, PiggyBank, Building2, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AvatarKind = "person" | "business";
export type BusinessCategory =
  | "food" | "transport" | "entertainment" | "bills" | "shopping"
  | "salary" | "telecom" | "events" | "savings" | "bank" | "merchant";

interface SmartAvatarProps {
  src?: string | null;
  name?: string | null;
  kind?: AvatarKind;
  category?: BusinessCategory;
  size?: number;
  className?: string;
}

const CATEGORY_MAP: Record<BusinessCategory, { icon: LucideIcon; bg: string; fg: string }> = {
  food:          { icon: Coffee,     bg: "bg-amber-500/15",   fg: "text-amber-600 dark:text-amber-400" },
  transport:     { icon: Car,        bg: "bg-sky-500/15",     fg: "text-sky-600 dark:text-sky-400" },
  entertainment: { icon: Tv,         bg: "bg-fuchsia-500/15", fg: "text-fuchsia-600 dark:text-fuchsia-400" },
  bills:         { icon: Receipt,    bg: "bg-rose-500/15",    fg: "text-rose-600 dark:text-rose-400" },
  shopping:      { icon: ShoppingBag,bg: "bg-primary/15",     fg: "text-primary" },
  salary:        { icon: Briefcase,  bg: "bg-accent/20",      fg: "text-accent" },
  telecom:       { icon: Smartphone, bg: "bg-emerald-500/15", fg: "text-emerald-600 dark:text-emerald-400" },
  events:        { icon: Calendar,   bg: "bg-violet-500/15",  fg: "text-violet-600 dark:text-violet-400" },
  savings:       { icon: PiggyBank,  bg: "bg-accent/20",      fg: "text-accent" },
  bank:          { icon: Building2,  bg: "bg-primary/15",     fg: "text-primary" },
  merchant:      { icon: Store,      bg: "bg-primary/15",     fg: "text-primary" },
};

const initialsOf = (name?: string | null) => {
  if (!name) return "KP";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const colorFromName = (name?: string | null) => {
  if (!name) return 0;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
};

const PERSON_PALETTE = [
  "bg-primary/15 text-primary",
  "bg-accent/20 text-accent",
  "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
];

export const SmartAvatar = ({
  src,
  name,
  kind = "person",
  category,
  size = 40,
  className,
}: SmartAvatarProps) => {
  const px = `${size}px`;
  const radius = kind === "business" ? "rounded-xl" : "rounded-full";
  const fontSize = Math.max(11, Math.round(size * 0.36));

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ""}
        loading="lazy"
        style={{ width: px, height: px }}
        className={cn(
          radius,
          "object-cover ring-2 ring-background animate-fade-in",
          className,
        )}
      />
    );
  }

  if (kind === "business") {
    const cat = CATEGORY_MAP[category ?? "merchant"];
    const Icon = cat.icon;
    return (
      <div
        style={{ width: px, height: px }}
        aria-label={name ?? "Business"}
        className={cn(radius, "flex items-center justify-center shrink-0", cat.bg, cat.fg, className)}
      >
        <Icon style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.2} />
      </div>
    );
  }

  const palette = PERSON_PALETTE[colorFromName(name) % PERSON_PALETTE.length];
  return (
    <div
      style={{ width: px, height: px, fontSize }}
      aria-label={name ?? "User"}
      className={cn(radius, "flex items-center justify-center font-bold font-syne shrink-0", palette, className)}
    >
      {initialsOf(name)}
    </div>
  );
};
