import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { BalanceCard } from "@/components/shared/BalanceCard";
import { QuickActions } from "@/components/shared/QuickActions";
import { SmartSuggestions } from "@/components/shared/SmartSuggestions";
import { RecentActivity } from "@/components/shared/RecentActivity";
import { LaunchPhaseBanner } from "@/components/shared/LaunchPhaseBanner";
import CollectionInfoBanner from "@/components/shared/CollectionInfoBanner";
import { supabase } from "@/integrations/supabase/client";
import { useMonnifyAccount } from "@/hooks/useMonnifyAccount";

const greetingFor = (d = new Date()) => {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const Index = () => {
  const navigate = useNavigate();
  const { profile, wallet, loading, user } = useAuth();
  const accountQuery = useMonnifyAccount(user?.id);
  const [weeklyDelta, setWeeklyDelta] = useState<number | undefined>(undefined);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const isVerified = (profile?.kyc_level ?? 0) >= 1;
  const balance = Number(wallet?.balance ?? 0);

  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from("transactions")
      .select("type,amount,metadata,status")
      .eq("user_id", user.id)
      .gte("created_at", weekAgo)
      .eq("status", "completed")
      .then(({ data }) => {
        if (!data) return;
        let delta = 0;
        for (const tx of data as any[]) {
          const credit = tx.type === "deposit" || tx.type === "ajo_disbursement" || tx.metadata?.direction === "credit";
          delta += (credit ? 1 : -1) * Number(tx.amount ?? 0);
        }
        setWeeklyDelta(delta);
      });
  }, [user]);

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-6 space-y-5">
      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tightish leading-tight">
            <span className="block text-sm font-medium text-muted-foreground">{greetingFor()},</span>
            <span className="block truncate">{firstName}</span>
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            <p className="text-xs text-muted-foreground truncate">Welcome back</p>
            {isVerified && (
              <span
                className="inline-flex shrink-0 items-center gap-0.5 bg-accent/15 text-accent text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                aria-label="KYC verified"
              >
                <CheckCircle className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <NotificationCenter />
          <Avatar
            className="h-11 w-11 cursor-pointer ring-2 ring-primary/10"
            onClick={() => navigate("/profile")}
          >
            {profile?.avatar_url && (
              <AvatarImage src={`${profile.avatar_url}?t=${Date.now()}`} alt={profile.full_name} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
              {profile?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "KP"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <LaunchPhaseBanner />

      <div className="space-y-5">
        <BalanceCard
          amount={balance}
          accountNumber={accountQuery.data?.status === "ready" ? accountQuery.data.account_number : null}
          bankName={accountQuery.data?.status === "ready" ? accountQuery.data.bank_name : null}
          loading={loading}
          weeklyDelta={weeklyDelta}
        />
        <QuickActions />

        <CollectionInfoBanner />
        <SmartSuggestions />
        <RecentActivity limit={6} />
      </div>
    </div>
  );
};

export default Index;
