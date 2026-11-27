import { useState } from "react";
import {
  Home,
  Compass,
  Wallet,
  User,
  Send,
  Users,
  ClipboardList,
  Bike,
  Calendar,
  Store,
  Receipt,
  PiggyBank,
  Smartphone,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PayActionSheet } from "@/components/shared/PayActionSheet";
import logo from "@/assets/kukapay-logo.png";

const PRIMARY = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Discover", path: "/discover" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: Receipt, label: "Transactions", path: "/transactions" },
  { icon: User, label: "Profile", path: "/profile" },
];

const SECONDARY = [
  { icon: Users, label: "Ajo", path: "/ajo" },
  { icon: ClipboardList, label: "Collections", path: "/collect" },
  { icon: Bike, label: "Errands", path: "/errands" },
  { icon: Calendar, label: "Events", path: "/events" },
  { icon: Store, label: "Merchants", path: "/merchants" },
  { icon: PiggyBank, label: "Savings", path: "/savings" },
  { icon: Smartphone, label: "Airtime", path: "/airtime" },
];

const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [payOpen, setPayOpen] = useState(false);

  const isActive = (p: string) =>
    p === "/" ? location.pathname === "/" : location.pathname.startsWith(p);

  return (
    <>
      <aside
        aria-label="Primary"
        className="hidden md:flex fixed inset-y-0 left-0 w-64 border-r border-border bg-card flex-col z-40"
      >
        <div className="px-6 pt-6 pb-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center"
            aria-label="KukaPay home"
          >
            <img
              src={logo}
              alt="KukaPay"
              className="h-9 w-auto object-contain"
            />
          </button>
        </div>

        <div className="px-4">
          <Button
            onClick={() => setPayOpen(true)}
            className="w-full h-11 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-fab"
          >
            <Send className="h-4 w-4" />
            Send or Pay
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <SidebarSection items={PRIMARY} active={isActive} onGo={navigate} />
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              More
            </p>
            <SidebarSection items={SECONDARY} active={isActive} onGo={navigate} />
          </div>
        </nav>

        <div className="px-6 py-4 border-t border-border text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} KukaPay
        </div>
      </aside>

      <PayActionSheet open={payOpen} onOpenChange={setPayOpen} />
    </>
  );
};

const SidebarSection = ({
  items,
  active,
  onGo,
}: {
  items: { icon: typeof Home; label: string; path: string }[];
  active: (p: string) => boolean;
  onGo: (p: string) => void;
}) => (
  <div className="space-y-1">
    {items.map((it) => {
      const on = active(it.path);
      return (
        <button
          key={it.path}
          onClick={() => onGo(it.path)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
            on
              ? "bg-primary/10 text-primary"
              : "text-foreground/70 hover:bg-muted hover:text-foreground",
          )}
        >
          <it.icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
          <span className="truncate">{it.label}</span>
        </button>
      );
    })}
  </div>
);

export default DesktopSidebar;
