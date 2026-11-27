import { Eye, EyeOff, Copy, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BalanceCardProps {
  amount: number;
  accountNumber?: string | null;
  bankName?: string | null;
  loading?: boolean;
  weeklyDelta?: number;
}

const formatNaira = (n: number) =>
  n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatAccount = (n: string) => n.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");

const PRIVACY_KEY = "kp_privacy_mode";

export const BalanceCard = ({
  amount,
  accountNumber,
  bankName,
  loading,
  weeklyDelta,
}: BalanceCardProps) => {
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(PRIVACY_KEY) === "1";
  });
  const value = useMotionValue(0);
  const display = useTransform(value, (v) => formatNaira(v));

  useEffect(() => {
    const controls = animate(value, amount, { duration: 0.8, ease: "easeOut" });
    return controls.stop;
  }, [amount, value]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === PRIVACY_KEY) setHidden(e.newValue === "1");
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const togglePrivacy = () => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem(PRIVACY_KEY, next ? "1" : "0");
    window.dispatchEvent(new StorageEvent("storage", { key: PRIVACY_KEY, newValue: next ? "1" : "0" }));
  };

  const copyAccount = () => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber);
    toast.success("Account number copied");
  };

  const positive = (weeklyDelta ?? 0) >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-6 text-white",
        "bg-primary shadow-soft-lg",
      )}
    >

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider text-white/75 font-semibold">
            Total balance
          </p>
          <button
            onClick={togglePrivacy}
            aria-label={hidden ? "Show balance" : "Hide balance"}
            className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors active:scale-95"
          >
            {hidden ? <EyeOff className="h-4 w-4" strokeWidth={1.6} /> : <Eye className="h-4 w-4" strokeWidth={1.6} />}
          </button>
        </div>

        <div className="flex items-baseline gap-1.5 pt-3">
          <span className="text-2xl font-bold font-mono-num">₦</span>
          {hidden ? (
            <span className="text-[44px] font-bold font-mono-num tracking-tightish">••••••</span>
          ) : loading ? (
            <span className="text-[44px] font-bold font-mono-num tracking-tightish">0.00</span>
          ) : (
            <motion.span className="text-[44px] font-bold font-mono-num tracking-tightish leading-none">
              {display}
            </motion.span>
          )}
        </div>

        {!hidden && weeklyDelta !== undefined && Math.abs(weeklyDelta) > 0 && (
          <div className="flex items-center gap-1.5 pt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 bg-white/15 text-white",
              )}
            >
              <TrendIcon className="h-3 w-3" strokeWidth={1.8} />
              {positive ? "+" : "−"}₦{formatNaira(Math.abs(weeklyDelta))}
            </span>
            <span className="text-[11px] text-white/70">this week</span>
          </div>
        )}

        {accountNumber && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/15">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-white/65 font-semibold">
                {bankName ?? "Virtual account"}
              </p>
              <p className="font-mono-num text-sm font-semibold truncate text-white">
                {formatAccount(accountNumber)}
              </p>
            </div>
            <button
              onClick={copyAccount}
              aria-label="Copy account number"
              className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors active:scale-95"
            >
              <Copy className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
