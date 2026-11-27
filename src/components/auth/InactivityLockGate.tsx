import { useEffect, useState } from "react";
import { Fingerprint, Loader2, Lock, LogOut, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { send2FaEmailOtp, verify2FaEmailOtp } from "@/lib/auth-2fa";
import { authenticateBiometric, hasStoredBiometricCred } from "@/lib/biometrics";
import { unlockApp, isLockExpired } from "@/lib/inactivity-lock";
import logo from "@/assets/kukapay-logo.png";

const InactivityLockGate = () => {
  const { user, profile, signOut } = useAuth();
  const email = user?.email ?? "";
  const [mode, setMode] = useState<"choose" | "otp">("choose");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);

  const canUseBiometric = hasStoredBiometricCred(user?.id) || !!profile?.biometric_enabled;

  // Locked too long — end the session for safety.
  useEffect(() => {
    const check = () => {
      if (isLockExpired()) {
        unlockApp();
        toast.info("You were away for a while, so we signed you out.");
        signOut();
      }
    };
    check();
    const id = setInterval(check, 30_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [signOut]);

  const handleBiometric = async () => {
    setBusy(true);
    const result = await authenticateBiometric(user?.id);
    setBusy(false);
    if (result.success) {
      toast.success("Welcome back!");
      unlockApp();
    } else {
      toast.error(result.error || "Fingerprint check failed. Try the email code instead.");
    }
  };

  const handleSendCode = async () => {
    if (!email) {
      toast.error("We couldn't find your email. Please sign in again.");
      return;
    }
    setSending(true);
    const sent = await send2FaEmailOtp(email);
    setSending(false);
    if (sent.success) {
      setMode("otp");
      toast.info(`We sent a 6-digit code to ${email}.`);
    } else {
      toast.error(sent.error || "We couldn't send the code. Please try again.");
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setBusy(true);
    const result = await verify2FaEmailOtp(email, code);
    setBusy(false);
    if (result.success) {
      toast.success("Welcome back!");
      unlockApp();
    } else {
      setCode("");
      toast.error(result.error || "That code didn't work. Request a new one.");
    }
  };

  const handleSignOut = async () => {
    unlockApp();
    await signOut();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-8 animate-slide-up">
        <div className="flex flex-col items-center text-center space-y-3">
          <img src={logo} alt="KukaPay" className="h-12 w-12 rounded-2xl shadow-soft" />
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Session locked</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "otp"
                ? `Enter the 6-digit code we sent to ${email}`
                : "You were inactive for a while. Unlock to continue — no password needed."}
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-card border border-border p-6 shadow-soft space-y-4">
          {mode === "choose" ? (
            <>
              {canUseBiometric && (
                <Button
                  type="button"
                  className="w-full h-12 rounded-xl gap-2 font-semibold"
                  onClick={handleBiometric}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
                  Unlock with Fingerprint / Face ID
                </Button>
              )}

              <Button
                type="button"
                variant={canUseBiometric ? "outline" : "default"}
                className="w-full h-12 rounded-xl gap-2 font-semibold"
                onClick={handleSendCode}
                disabled={sending || busy}
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                Email me a 6-digit code
              </Button>
            </>
          ) : (
            <div className="space-y-5 flex flex-col items-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-xs text-muted-foreground">Code expires in 5 minutes</p>

              <Button
                type="button"
                className="w-full h-12 rounded-xl font-semibold"
                disabled={busy || code.length !== 6}
                onClick={handleVerify}
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Unlock"}
              </Button>

              <div className="flex items-center justify-between w-full text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode("choose");
                    setCode("");
                  }}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sending}
                  className="text-primary font-semibold hover:underline disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Resend code"}
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full text-xs text-muted-foreground hover:text-foreground font-medium flex items-center justify-center gap-1 pt-2"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out and use my password
          </button>
        </div>
      </div>
    </div>
  );
};

export default InactivityLockGate;
