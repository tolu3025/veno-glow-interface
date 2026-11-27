import { useEffect, useState } from "react";
import { WifiOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import errorOffline from "@/assets/error-offline.png?inline";

interface OfflineGateProps {
  children: React.ReactNode;
}

export const OfflineGate = ({ children }: OfflineGateProps) => {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRecheck = () => {
    setChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        setIsOnline(true);
      }
      setChecking(false);
    }, 800);
  };

  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#F9FAFB] px-6 text-center">
        <div className="w-full max-w-md space-y-6">
          <img
            src={errorOffline}
            alt="You are offline"
            className="mx-auto max-h-[260px] w-auto object-contain"
            draggable={false}
          />
          <div className="space-y-2">
            <h2 className="flex items-center justify-center gap-2 text-2xl font-extrabold text-[#111827]">
              <WifiOff className="h-6 w-6 text-[#EF4444]" /> Connection Lost
            </h2>
            <p className="text-sm text-muted-foreground">
              Please check your internet connection. We will automatically reconnect you once you're back online.
            </p>
          </div>
          <Button
            onClick={handleRecheck}
            disabled={checking}
            className="w-full gap-2 rounded-full h-12 text-sm font-semibold"
          >
            <RotateCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking Connection…" : "Try Again"}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default OfflineGate;
