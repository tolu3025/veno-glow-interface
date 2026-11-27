import { useEffect, useState } from "react";
import MobileWrapper from "./MobileWrapper";
import BottomNav from "./BottomNav";
import useSessionTimeout from "@/hooks/useSessionTimeout";
import { PageTransition } from "@/components/shared/PageTransition";
import MatricCorrectionBanner from "@/components/shared/MatricCorrectionBanner";
import OpenInAppBanner from "@/components/shared/OpenInAppBanner";
import Level0ReverifyGate from "@/components/auth/Level0ReverifyGate";
import InactivityLockGate from "@/components/auth/InactivityLockGate";
import { isAppLocked, LOCK_EVENT } from "@/lib/inactivity-lock";

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  useSessionTimeout();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const sync = () => setLocked(isAppLocked());
    sync();
    window.addEventListener(LOCK_EVENT, sync);
    return () => window.removeEventListener(LOCK_EVENT, sync);
  }, []);

  if (locked) return <InactivityLockGate />;

  return (
    <MobileWrapper>
      <OpenInAppBanner />
      <main className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <MatricCorrectionBanner />
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
      <Level0ReverifyGate />
    </MobileWrapper>
  );
};

export default AppShell;
