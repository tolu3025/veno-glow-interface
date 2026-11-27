import { Delete } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PasscodePadProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  title?: string;
  subtitle?: string;
  error?: boolean;
  autoSubmitDelayMs?: number;
  onComplete?: (pin: string) => void;
  variant?: "light" | "dark";
  loading?: boolean;
}

export const PasscodePad = ({
  value,
  onChange,
  length = 4,
  title,
  subtitle,
  error,
  autoSubmitDelayMs = 200,
  onComplete,
  variant = "light",
  loading = false,
}: PasscodePadProps) => {
  const [popping, setPopping] = useState<number | null>(null);
  const dark = variant === "dark";

  const handleKey = (key: string) => {
    if (loading) return;
    if (key === "del") {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= length) return;
    const next = value + key;
    onChange(next);
    setPopping(next.length - 1);
    setTimeout(() => setPopping(null), 220);
    if (next.length === length && onComplete) {
      setTimeout(() => onComplete(next), autoSubmitDelayMs);
    }
  };

  return (
    <div className={cn("flex flex-col items-center select-none gap-8", dark && "pin-surface")}>
      {(title || subtitle) && (
        <div className="text-center space-y-1.5">
          {title && (
            <h2 className={cn("text-[20px] font-semibold tracking-tightish", dark ? "text-white" : "text-foreground")}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className={cn("text-[13px]", dark ? "text-white/60" : "text-muted-foreground")}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Dots */}
      <div className={cn("flex gap-3", error && "animate-pin-shake")}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <div
              key={i}
              className={cn(
                "h-4 w-4 rounded-full transition-colors",
                filled
                  ? "bg-accent shadow-[0_0_12px_rgba(0,210,211,0.55)]"
                  : dark
                    ? "bg-[#3A3A5C]"
                    : "bg-muted",
                popping === i && "animate-pin-fill-pop",
              )}
            />
          );
        })}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2 w-72">
        {["1","2","3","4","5","6","7","8","9","","0","del"].map((key, idx) =>
          key === "" ? (
            <div key={`empty-${idx}`} />
          ) : (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              disabled={loading}
              className={cn(
                "h-[72px] rounded-full flex items-center justify-center text-[28px] font-normal transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
                dark
                  ? "text-white hover:bg-white/8 active:bg-white/12"
                  : "text-foreground hover:bg-muted/70 active:bg-muted",
              )}
            >
              {key === "del" ? <Delete className="h-6 w-6" strokeWidth={1.6} /> : key}
            </button>
          ),
        )}
      </div>
    </div>
  );
};
