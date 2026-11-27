import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMonnifyAccount } from "@/hooks/useMonnifyAccount";

// Intercepts users stuck on Level 0 without a Monnify account and offers NIN verification.
const Level0ReverifyGate = () => {
  const { profile, loading, user } = useAuth();
  const accountQuery = useMonnifyAccount(user?.id);
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  const needsReverify =
    !!user &&
    !!profile &&
    (profile.kyc_level ?? 0) === 0 &&
    ["pending", "unverified", "rejected"].includes((profile.kyc_status as string) || "") &&
    !accountQuery.isPending &&
    !accountQuery.isError &&
    !(accountQuery.data?.status === "ready" && accountQuery.data.account_number) &&
    // give brand-new signups 10 minutes to finish the normal flow
    Date.now() - new Date(profile.created_at).getTime() > 10 * 60 * 1000;

  // Don't block on KYC / auth / onboarding routes themselves
  const onExemptRoute =
    location.pathname.startsWith("/kyc") ||
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/onboarding") ||
    location.pathname.startsWith("/verify") ||
    location.pathname.startsWith("/forgot") ||
    location.pathname.startsWith("/reset");

  if (loading || !needsReverify || onExemptRoute) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-3xl bg-card border border-border shadow-soft-lg p-6 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold">Re-verify your NIN</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Your account was created during an ID provider outage and your virtual
          account was not set up. Please re-verify your NIN — it takes under a
          minute — to activate your wallet.
        </p>
        <Button
          className="w-full h-12 rounded-2xl mt-5"
          onClick={() => navigate("/kyc?reverify=1")}
        >
          Re-verify NIN now
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="mt-3 text-xs text-muted-foreground underline"
        >
          Do it later
        </button>
      </div>
    </div>
  );
};

export default Level0ReverifyGate;
