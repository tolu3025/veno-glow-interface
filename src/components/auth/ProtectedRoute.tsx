import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginPinGate from "./LoginPinGate";
import BiometricSetupPrompt, { BIOMETRIC_PROMPT_KEY } from "./BiometricSetupPrompt";
import { hasStoredBiometricCred, isBiometricSupported } from "@/lib/biometrics";
import { KukaPayLoader } from "@/components/shared/KukaPayLoader";
import {
  getSessionBand,
  isStepUpSatisfied,
  confirmStepUp,
} from "@/lib/session-risk";

const isInstalledPwa = () => {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
  // iOS Safari
  const iosStandalone = (window.navigator as any).standalone === true;
  return Boolean(standalone || iosStandalone);
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const location = useLocation();
  const [pinVerified, setPinVerified] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("kuka_pin_verified") === "true";
  });
  const [stepUpDone, setStepUpDone] = useState(() => isStepUpSatisfied());
  const [bioOffered, setBioOffered] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  // A profile that loaded slowly or partially can look like "no PIN yet" and wrongly
  // send the student back to PIN setup. Re-check with the server once before that.
  const [pinRecheck, setPinRecheck] = useState<"idle" | "checking" | "done">("idle");

  useEffect(() => {
    if (pinRecheck !== "idle") return;
    if (!user || !profile || profile.has_login_pin) return;
    setPinRecheck("checking");
    refreshProfile()
      .catch(() => undefined)
      .finally(() => setPinRecheck("done"));
  }, [user, profile, pinRecheck, refreshProfile]);

  useEffect(() => {
    let alive = true;
    isBiometricSupported()
      .then((c) => alive && setBioSupported(c.isAvailable))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <KukaPayLoader isLoading label="Authenticating..." />;
  }

  if (!user) {
    const onboarded = typeof window !== "undefined" && localStorage.getItem("kuka_onboarded_v1") === "1";
    return <Navigate to={onboarded ? "/login" : "/onboarding"} replace />;
  }

  const band = getSessionBand();
  const riskySession = band === "elevated" || band === "high";

  // Force PIN setup when running as installed PWA, or when this sign-in looks risky
  // and the account has no PIN to confirm it with.
  if (profile && !profile.has_login_pin && pinRecheck !== "done") {
    return <KukaPayLoader isLoading label="Checking your security settings..." />;
  }

  if (
    profile &&
    !profile.has_login_pin &&
    (isInstalledPwa() || (riskySession && !stepUpDone)) &&
    location.pathname !== "/security/set-login-pin"
  ) {
    return <Navigate to="/security/set-login-pin" replace />;
  }

  // Show login PIN gate if user has a login PIN set and hasn't verified this session
  if (profile?.has_login_pin && !pinVerified) {
    return (
      <LoginPinGate
        alert={
          riskySession
            ? band === "high"
              ? "This sign-in came from an unfamiliar device or place, so we need your PIN before you continue."
              : "We noticed a new device or location on this sign-in."
            : undefined
        }
        onVerified={() => {
          setPinVerified(true);
          if (riskySession) {
            confirmStepUp();
            setStepUpDone(true);
          }
        }}
      />
    );
  }

  // Risky session that hasn't been confirmed with the PIN yet — step up now.
  if (profile?.has_login_pin && riskySession && !stepUpDone) {
    return (
      <LoginPinGate
        heading="Confirm it's really you"
        subtitle="Enter your 4-digit PIN to continue"
        alert={
          band === "high"
            ? "This sign-in came from an unfamiliar device or place. Until you confirm it, spending is limited to ₦5,000."
            : "New device or location detected on this sign-in."
        }
        onVerified={() => {
          confirmStepUp();
          setStepUpDone(true);
        }}
      />
    );
  }

  // Offer fingerprint / Face ID once the student is fully signed in.
  const shouldOfferBiometrics =
    !bioOffered &&
    bioSupported &&
    Boolean(user) &&
    (profile?.kyc_level ?? 0) >= 1 &&
    !hasStoredBiometricCred(user?.id) &&
    typeof window !== "undefined" &&
    localStorage.getItem(BIOMETRIC_PROMPT_KEY) !== "1";

  if (shouldOfferBiometrics) {
    return <BiometricSetupPrompt onDone={() => setBioOffered(true)} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
