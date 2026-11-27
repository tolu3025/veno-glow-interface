import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkEmailExists } from "@/lib/auth-check.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
import logo from "@/assets/kukapay-logo.png";

const RESEND_COOLDOWN = 30;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendLink = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setIsLoading(true);
    try {
      // Optional, non-blocking email-exists precheck.
      // If the server function fails for any reason (network, env, deploy),
      // we still proceed with the Supabase reset so users never see
      // "failed to fetch" on a working account.
      try {
        const { exists } = await checkEmailExists({ data: { email: trimmed } });
        if (exists === false) {
          toast.error("No account found with this email address");
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn("[ForgotPassword] email precheck skipped:", e);
      }

      const origin =
        typeof window !== "undefined" ? window.location.origin : "https://app.kukapay.com.ng";
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      console.error("[ForgotPassword] error:", err);
      toast.error(err?.message || "Could not send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendLink();
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-5 py-10">
      <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm space-y-6 animate-slide-up">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>

        <div className="flex flex-col items-center text-center space-y-3">
          <img src={logo} alt="KukaPay" className="h-12 w-12 rounded-2xl shadow-soft" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {sent ? "Check your inbox" : "Forgot password?"}
            </h1>
            <p className="text-sm text-muted-foreground px-2">
              {sent
                ? "We sent a reset link to your email. Tap it to set a new password."
                : "Enter your email and we'll send you a link to reset your password."}
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@uni.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold active:scale-[0.98] transition-transform"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/10 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Reset link sent</p>
                  <p className="text-xs text-muted-foreground break-all">{email}</p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => window.open("mailto:", "_self")}
                className="w-full h-12 rounded-xl text-base font-semibold active:scale-[0.98] transition-transform"
              >
                <Mail className="h-5 w-5 mr-2" /> Open email app
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Didn't get it? Check your spam folder, or{" "}
                {cooldown > 0 ? (
                  <span className="text-foreground/60 font-medium">resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={sendLink}
                    disabled={isLoading}
                    className="text-primary font-semibold hover:underline disabled:opacity-50"
                  >
                    {isLoading ? "sending..." : "resend now"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Remembered it?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
