import {
  Smartphone, Users, ShoppingBag, Briefcase, Calendar,
  RefreshCcw, PiggyBank, Coins, GraduationCap, ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MERCHANT_PORTAL_URL } from "@/components/shared/ExternalMerchantRedirect";
import toyesekLogo from "@/assets/toyesek-logo.png.asset.json";

interface Service {
  icon?: LucideIcon;
  image?: string;
  label: string;
  path: string;
  desc: string;
  grad: string;
  span?: string;
  external?: boolean;
  badge?: "new";
}

const SERVICES: Service[] = [
  { icon: GraduationCap, label: "Request a Service", path: "/services/request/new", desc: "Thesis, projects, freelance", grad: "bg-grad-ajo", span: "row-span-2", badge: "new" },
  { icon: ShoppingBag,   label: "All Merchants",     path: "/merchants", desc: "Food, printing, laundry & more", grad: "bg-grad-merchants" },
  { image: toyesekLogo.url, label: "Book a Ride",    path: "/rides", desc: "Toyesek campus transport", grad: "bg-grad-activity", badge: "new" },
  { icon: ClipboardList, label: "My Requests",       path: "/services/requests", desc: "Track service jobs", grad: "bg-grad-events" },
  { icon: RefreshCcw,    label: "Ajo",               path: "/ajo", desc: "Rotating savings", grad: "bg-grad-ajo", span: "row-span-2" },
  { icon: Users,         label: "Errands",           path: "/errands", desc: "Campus errands", grad: "bg-grad-errands" },
  { icon: Smartphone,    label: "Airtime & Data",    path: "/airtime", desc: "Top up airtime & data", grad: "bg-grad-airtime" },
  { icon: Calendar,      label: "Events",            path: "/events", desc: "Tickets & check-in", grad: "bg-grad-events" },
  { icon: Coins,         label: "Convert",           path: "/wallet/convert-crypto", desc: "Crypto ↔ Naira", grad: "bg-grad-activity" },
  { icon: PiggyBank,     label: "Savings",           path: "/savings", desc: "Goals & auto-save", grad: "bg-grad-collections" },
  { icon: Briefcase,     label: "Sell",              path: MERCHANT_PORTAL_URL, desc: "Become a merchant", grad: "bg-grad-merchants", external: true },
];


const ServicesPage = () => {
  const navigate = useNavigate();
  return (
    <div className="px-5 pt-12 pb-28 space-y-6">
      <header>
        <h1 className="text-[26px] font-bold tracking-tightish">Discover</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Everything KukaPay can do
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 auto-rows-[80px]">
        {SERVICES.map((s) => (
          <button
            key={s.path + s.label}
            onClick={() => {
              if (s.external) {
                window.open(s.path, "_blank", "noopener,noreferrer");
              } else {
                navigate(s.path);
              }
            }}
            className={cn(
              "relative flex flex-col justify-between text-left p-4",
              "rounded-[20px] overflow-hidden",
              "transition-all duration-200 press-scale",
              "hover:-translate-y-0.5 hover:shadow-soft-lg",
              s.grad,
              s.span ?? "row-span-2",
            )}
          >
            {s.badge === "new" && (
              <span className="absolute top-2 right-2 text-[9px] font-bold bg-white/80 text-foreground px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                New
              </span>
            )}
            <div className="h-10 w-10 rounded-full bg-white/55 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              {s.image ? (
                <img src={s.image} alt="" className="h-full w-full object-cover" />
              ) : s.icon ? (
                <s.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              ) : null}
            </div>

            <div>
              <p className="text-[16px] font-bold text-foreground leading-tight">
                {s.label}
              </p>
              <p className="text-[12px] text-foreground/65 leading-snug mt-0.5">
                {s.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServicesPage;
