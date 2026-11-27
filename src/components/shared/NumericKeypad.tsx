import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumericKeypadProps {
  value: string;
  onChange: (next: string) => void;
  max?: number;
  onMax?: () => void;
  showMax?: boolean;
}

const sanitize = (v: string, max: number) => {
  // allow digits and a single dot
  let next = v.replace(/[^\d.]/g, "");
  const firstDot = next.indexOf(".");
  if (firstDot !== -1) {
    next = next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, "");
    // limit to 2 decimals
    const [a, b = ""] = next.split(".");
    next = a + "." + b.slice(0, 2);
  }
  const num = Number(next);
  if (!isNaN(num) && num > max) return String(max);
  return next;
};

export const NumericKeypad = ({ value, onChange, max = 100_000_000, onMax, showMax = true }: NumericKeypadProps) => {
  const press = (k: string) => {
    if (k === "del") return onChange(value.slice(0, -1));
    if (k === ".") {
      if (value.includes(".")) return;
      return onChange((value || "0") + ".");
    }
    onChange(sanitize(value + k, max));
  };

  return (
    <div className="space-y-3 select-none">
      {showMax && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onMax}
            className="text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary/80 px-3 py-1.5 rounded-full bg-primary/10 active:scale-95 transition-all"
          >
            Max
          </button>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2.5">
        {["1","2","3","4","5","6","7","8","9",".","0","del"].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className="h-14 rounded-2xl bg-muted/70 hover:bg-muted active:scale-95 active:bg-primary/10 flex items-center justify-center text-2xl font-mono-num font-semibold transition-all"
          >
            {k === "del" ? <Delete className="h-5 w-5" /> : k}
          </button>
        ))}
      </div>
    </div>
  );
};
