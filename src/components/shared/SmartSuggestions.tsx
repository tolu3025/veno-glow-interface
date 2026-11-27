import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Smartphone, Send, Store, ShieldCheck, Plus, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Suggestion {
  key: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
}

export const SmartSuggestions = () => {
  const navigate = useNavigate();
  const { user, profile, wallet } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("transactions")
        .select("type, metadata, amount, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25);
      if (cancelled) return;
      const out: Suggestion[] = [];

      // Last P2P recipient
      const lastP2P = data?.find(
        (t: any) => t.type === "p2p_transfer" && t.metadata?.direction === "debit" && t.metadata?.counterparty_name
      ) as any;
      if (lastP2P?.metadata?.counterparty_name) {
        out.push({
          key: "p2p",
          icon: Send,
          title: `Pay ${String(lastP2P.metadata.counterparty_name).split(" ")[0]} again`,
          subtitle: "Repeat your last transfer",
          onClick: () => navigate("/send"),
        });
      }

      // Last airtime
      const lastAirtime = data?.find((t: any) => t.type === "airtime") as any;
      if (lastAirtime) {
        const network = lastAirtime.metadata?.network ?? "Airtime";
        out.push({
          key: "airtime",
          icon: Smartphone,
          title: `Top up ${network} again`,
          subtitle: "Buy airtime in seconds",
          onClick: () => navigate("/airtime"),
        });
      }

      // Last merchant
      const lastMerchant = data?.find(
        (t: any) => t.type === "collection_payment" && t.metadata?.merchant_name
      ) as any;
      if (lastMerchant?.metadata?.merchant_name) {
        out.push({
          key: "merchant",
          icon: Store,
          title: `Pay ${lastMerchant.metadata.merchant_name} again`,
          subtitle: "Recent merchant",
          onClick: () => navigate("/merchants"),
        });
      }

      // Profile-based nudges (only if signal is missing)
      if (out.length < 3 && profile?.kyc_status !== "verified") {
        out.push({
          key: "kyc",
          icon: ShieldCheck,
          title: "Verify your identity",
          subtitle: "Unlock higher limits",
          onClick: () => navigate("/kyc"),
        });
      }
      if (out.length < 3 && (wallet?.balance ?? 0) < 500) {
        out.push({
          key: "fund",
          icon: Plus,
          title: "Fund your wallet",
          subtitle: "Add money to get started",
          onClick: () => navigate("/add-money"),
        });
      }

      setSuggestions(out.slice(0, 4));
    })();
    return () => { cancelled = true; };
  }, [user, profile, wallet, navigate]);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-sm">For you</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1">
        {suggestions.map((s) => (
          <button
            key={s.key}
            onClick={s.onClick}
            className="shrink-0 w-56 text-left p-3.5 rounded-2xl bg-card border border-accent/30 hover:border-accent active:scale-[0.98] transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                <s.icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground truncate">{s.subtitle}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
