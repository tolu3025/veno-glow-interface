import { useEffect, useRef, useState } from "react";
import { Home, Compass, Wallet, User, Send } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PayActionSheet } from "@/components/shared/PayActionSheet";

const TABS = [
  { icon: Home,    label: "Home",     path: "/" },
  { icon: Compass, label: "Discover", path: "/discover" },
  { icon: Wallet,  label: "Wallet",   path: "/wallet" },
  { icon: User,    label: "Profile",  path: "/profile" },
] as const;

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paySheetOpen, setPaySheetOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const isHome = location.pathname === "/";

  // Auto-hide on scroll-down for non-home pages so the bottom bar never
  // permanently blocks content. Shows again on scroll-up or at the bottom.
  useEffect(() => {
    if (isHome) {
      setHidden(false);
      return;
    }
    lastYRef.current = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const dy = y - lastYRef.current;
        const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 4;
        if (atBottom || y < 40) setHidden(false);
        else if (dy > 6) setHidden(true);
        else if (dy < -6) setHidden(false);
        lastYRef.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isHome, location.pathname]);

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[428px] z-50 pointer-events-none",
          "transition-transform duration-300 ease-out",
          "md:hidden",
          hidden ? "translate-y-full" : "translate-y-0",
        )}
      >
        <div className="relative pointer-events-auto">
          {/* Floating central FAB */}
          <button
            onClick={() => setPaySheetOpen(true)}
            aria-label="Send or pay"
            className={cn(
              "absolute left-1/2 -translate-x-1/2 -top-7 z-10",
              "h-14 w-14 rounded-full bg-accent text-accent-foreground",
              "flex items-center justify-center ring-4 ring-background",
              "shadow-fab animate-fab-pulse",
              "hover:scale-105 active:scale-95 transition-transform",
            )}
          >
            <Send className="h-5 w-5" strokeWidth={1.8} />
          </button>

          {/* Bar */}
          <div
            className={cn(
              "bg-card rounded-t-3xl shadow-nav",
              "pb-[max(env(safe-area-inset-bottom),0.5rem)]",
            )}
          >
            <div className="grid grid-cols-5 h-16 items-end pb-1">
              <NavButton {...TABS[0]} active={location.pathname === TABS[0].path} onClick={() => navigate(TABS[0].path)} />
              <NavButton {...TABS[1]} active={location.pathname === TABS[1].path} onClick={() => navigate(TABS[1].path)} />
              <div aria-hidden /> {/* FAB slot */}
              <NavButton {...TABS[2]} active={location.pathname.startsWith("/wallet")} onClick={() => navigate(TABS[2].path)} />
              <NavButton {...TABS[3]} active={location.pathname === TABS[3].path} onClick={() => navigate(TABS[3].path)} />
            </div>
          </div>
        </div>
      </nav>

      <PayActionSheet open={paySheetOpen} onOpenChange={setPaySheetOpen} />
    </>
  );
};

const NavButton = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95",
      active ? "text-primary" : "text-foreground/55 hover:text-foreground/80",
    )}
  >
    <Icon className="h-5 w-5" strokeWidth={1.5} />
    <span className={cn("text-[10px] leading-none", active ? "font-semibold" : "font-medium")}>
      {label}
    </span>
  </button>
);

export default BottomNav;
