import { useEffect, useState } from "react";
import logoDefault from "@/assets/kukapay-logo.png";
import { cn } from "@/lib/utils";

interface KukaPayLoaderProps {
  isLoading: boolean;
  isError?: boolean;
  label?: string;
  logoSrc?: string;
}

/**
 * PayPal-style loader: white overlay, pulsing logo, thin progress bar
 * with shimmer that animates 0 → 80% over 2s, snaps to 100% on complete,
 * then fades out and unmounts.
 */
export const KukaPayLoader = ({
  isLoading,
  isError = false,
  label,
  logoSrc,
}: KukaPayLoaderProps) => {
  const [mounted, setMounted] = useState(isLoading);
  const [completing, setCompleting] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setMounted(true);
      setCompleting(false);
      setFading(false);
      return;
    }
    if (!mounted) return;
    // snap to 100%, then fade out
    setCompleting(true);
    const t1 = setTimeout(() => setFading(true), 200);
    const t2 = setTimeout(() => setMounted(false), 520);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  if (!mounted) return null;

  const text = isError
    ? "Something went wrong. Try again."
    : label || "Just a moment…";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-white",
        "transition-opacity duration-300",
        fading ? "opacity-0" : "opacity-100",
      )}
      aria-busy={isLoading}
      aria-live="polite"
    >
      <img
        src={logoSrc || logoDefault}
        alt="KukaPay"
        className="h-12 w-12 object-contain animate-paypal-pulse"
        draggable={false}
      />

      <div className="relative h-1 w-[120px] overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out",
            isError ? "bg-[#EF4444]" : "bg-[#6C5CE7]",
          )}
          style={{
            width: completing ? "100%" : "80%",
            // when freshly mounted and still loading, animate from 0 → 80% over 2s
            transition: completing
              ? "width 250ms ease-out"
              : "width 2s ease-out",
          }}
        >
          {!isError && (
            <div
              className="absolute inset-0 -translate-x-full animate-paypal-shimmer"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
              }}
            />
          )}
        </div>
      </div>

      <p
        className={cn(
          "text-sm font-medium",
          isError ? "text-[#EF4444]" : "text-[#6B7280]",
        )}
      >
        {text}
      </p>
    </div>
  );
};

export default KukaPayLoader;
