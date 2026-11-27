import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Shield, CheckCircle2, Lock, Fingerprint } from "lucide-react";

// Animated counter that counts up to a target number
export const AnimatedCounter = ({
  target,
  duration = 1500,
  prefix = "",
  suffix = "",
  className,
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);

  return (
    <span className={cn("font-mono-num tabular-nums", className)}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Shimmer skeleton with fintech-style gradient
export const ShimmerBlock = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-lg bg-muted",
      className
    )}
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
  </div>
);

// Circular progress indicator
export const CircularProgress = ({
  value,
  size = 48,
  strokeWidth = 4,
  className,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

// Security verification animation
export const SecurityVerification = ({
  steps,
  onComplete,
}: {
  steps: string[];
  onComplete?: () => void;
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    if (currentStep >= steps.length) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => {
      setCompleted((prev) => [...prev, currentStep]);
      setCurrentStep((prev) => prev + 1);
    }, 800 + Math.random() * 400);
    return () => clearTimeout(timer);
  }, [currentStep, steps.length, onComplete]);

  return (
    <div className="space-y-3 w-full max-w-xs mx-auto">
      {steps.map((step, i) => {
        const isDone = completed.includes(i);
        const isActive = i === currentStep;
        return (
          <div
            key={step}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
              isDone && "border-primary/30 bg-primary/5",
              isActive && "border-primary/50 bg-primary/10 animate-pulse",
              !isDone && !isActive && "border-border bg-card opacity-50"
            )}
          >
            <div className="shrink-0">
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 text-primary animate-scale-in" />
              ) : isActive ? (
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
              )}
            </div>
            <span className={cn("text-sm", isDone ? "text-foreground" : "text-muted-foreground")}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Full-screen fintech loader
export const FintechPageLoader = ({ message = "Loading..." }: { message?: string }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 animate-fade-in">
      <div className="relative">
        <CircularProgress value={progress} size={64} strokeWidth={3}>
          <Shield className="h-6 w-6 text-primary" />
        </CircularProgress>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-muted-foreground">Secured with end-to-end encryption</p>
      </div>
    </div>
  );
};

// Transaction loading overlay
export const TransactionLoader = ({
  steps = ["Verifying identity", "Encrypting transaction", "Processing payment", "Confirming"],
  onComplete,
}: {
  steps?: string[];
  onComplete?: () => void;
}) => (
  <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-8 animate-fade-in">
    <div className="flex items-center gap-2 mb-2">
      <Lock className="h-5 w-5 text-primary" />
      <span className="text-sm font-medium">Secure Transaction</span>
    </div>
    <SecurityVerification steps={steps} onComplete={onComplete} />
  </div>
);

// Wallet balance shimmer
export const WalletShimmer = () => (
  <div className="space-y-3 p-4">
    <ShimmerBlock className="h-3 w-20" />
    <ShimmerBlock className="h-9 w-40" />
    <div className="flex gap-2 pt-1">
      <ShimmerBlock className="h-9 w-24 rounded-lg" />
      <ShimmerBlock className="h-9 w-24 rounded-lg" />
    </div>
  </div>
);

// Card list shimmer
export const CardListShimmer = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <ShimmerBlock className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <ShimmerBlock className="h-4 w-32" />
            <ShimmerBlock className="h-3 w-20" />
          </div>
          <ShimmerBlock className="h-4 w-16" />
        </div>
      </div>
    ))}
  </div>
);
