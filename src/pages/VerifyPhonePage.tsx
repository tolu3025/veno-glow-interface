import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VerifyPhonePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [phoneMasked, setPhoneMasked] = useState<string | null>(null);
  const [errorShake, setErrorShake] = useState(false);
  const autoSent = useRef(false);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!autoSent.current) { autoSent.current = true; void sendCode(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function sendCode(silent = false) {
    setSending(true);
    try {
      const data = await friendlyInvoke<{ phone_masked: string; retry_after_seconds?: number }>(
        "phone-otp", { body: { action: "send" } }, "Failed to send code"
      );
      setPhoneMasked(data.phone_masked);
      setCooldown(60);
      if (!silent) toast.success("New code sent");
    } catch (e: any) {
      toast.error(e.message);
      // Backend may still surface retry_after via the thrown message; cooldown stays as-is.
    } finally {
      setSending(false);
    }
  }

  async function verify(submitCode: string) {
    if (submitCode.length !== 6 || verifying) return;
    setVerifying(true);
    try {
      await friendlyInvoke("phone-otp", { body: { action: "verify", code: submitCode } }, "Invalid code");
      setVerified(true);
      toast.success("Phone verified");
      setTimeout(() => navigate("/", { replace: true }), 900);
    } catch (e: any) {
      toast.error(e.message);
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      setCode("");
      autoSubmitted.current = false;
    } finally {
      setVerifying(false);
    }
  }

  function onChange(v: string) {
    const next = v.replace(/\D/g, "").slice(0, 6);
    setCode(next);
    if (next.length === 6 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void verify(next);
    }
  }

  const formatTimer = (s: number) => `0:${s.toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 -ml-2 rounded-full flex items-center justify-center hover:bg-muted transition"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          Step 2 of 2
        </span>
        <div className="w-10" />
      </div>

      {/* Progress bar */}
      <div className="px-5">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-full bg-primary rounded-full transition-all" />
        </div>
      </div>

      <div className="flex-1 px-5 pt-10 pb-8 flex flex-col">
        {/* Icon */}
        <div
          className={cn(
            "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-all",
            verified ? "bg-emerald-500/10" : "bg-primary/10"
          )}
        >
          {verified ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-500 animate-in zoom-in duration-300" />
          ) : (
            <ShieldCheck className="h-8 w-8 text-primary" />
          )}
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {verified ? "You're verified" : "Enter verification code"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {verified ? (
            "Taking you to your dashboard…"
          ) : phoneMasked ? (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-foreground">{phoneMasked}</span>.{" "}
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="text-primary font-medium hover:underline"
              >
                Change number
              </button>
            </>
          ) : (
            "Sending you a verification code…"
          )}
        </p>

        {/* OTP input */}
        <div
          className={cn(
            "mt-10 flex justify-center transition-transform",
            errorShake && "animate-[shake_0.4s_ease-in-out]"
          )}
        >
          <InputOTP
            maxLength={6}
            value={code}
            onChange={onChange}
            disabled={verifying || verified}
            autoFocus
            inputMode="numeric"
            pattern="\d*"
            containerClassName="gap-2"
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className={cn(
                    "h-14 w-12 text-xl font-bold rounded-xl border-2 transition-all",
                    "data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/20",
                    code[i] && "border-primary/60 bg-primary/5 scale-[1.02]"
                  )}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {verifying && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
          </div>
        )}

        {/* Resend */}
        <div className="mt-8 text-center">
          {cooldown > 0 ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-xs font-medium text-muted-foreground font-mono-num">
              Resend code in {formatTimer(cooldown)}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => sendCode(false)}
              disabled={sending || verified}
              className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
            >
              {sending ? "Sending…" : "Resend code"}
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* Footer */}
        <div className="space-y-3 pt-8">
          <Button
            className="w-full h-12 rounded-xl text-base font-semibold"
            disabled={code.length !== 6 || verifying || verified}
            onClick={() => verify(code)}
          >
            {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify phone"}
          </Button>

          <div className="flex items-center justify-between text-xs">
            <a
              href="mailto:support@kukapay.com.ng?subject=OTP%20help"
              className="text-muted-foreground hover:text-foreground"
            >
              Need help?
            </a>
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
