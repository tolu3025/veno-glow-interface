import { useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { recordSecurityLog } from "@/lib/security-log";
import { startRiskSession } from "@/lib/session-risk";
import { loginSchema, type LoginFormValues } from "@/lib/validators";
import { Loader2, Eye, EyeOff, Fingerprint, ShieldCheck, ArrowLeft, Mail } from "lucide-react";
import { checkUser2FaStatus, send2FaEmailOtp, verify2FaEmailOtp, type User2FaStatus } from "@/lib/auth-2fa";
import { authenticateBiometric, hasStoredBiometricCred, getStoredBiometricUserEmail } from "@/lib/biometrics";
import logo from "@/assets/kukapay-logo.png";

const LoginPage = () => {
  const { user, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"credentials" | "otp" | "choose_method">("credentials");
  const [otpCode, setOtpCode] = useState("");
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);
  const [user2FaStatus, setUser2FaStatus] = useState<User2FaStatus | null>(null);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    setHasBiometric(hasStoredBiometricCred());
  }, []);

  if (user) return <Navigate to={redirectTo} replace />;

  const completeLogin = async (email: string, pass: string) => {
    setIsLoading(true);
    const { error } = await signIn(email, pass);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const { data: { user: loggedUser } } = await supabase.auth.getUser();
    if (loggedUser) {
      await recordSecurityLog({ user_id: loggedUser.id, action: "login" });
      const risk = await startRiskSession(loggedUser.id);
      if (risk.band === "high") {
        toast.warning("This sign-in looks unusual. Please confirm it with your PIN.");
      } else if (risk.band === "elevated") {
        toast.info("New device or location detected — confirm with your PIN.");
      }
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);

    // Check student's 2FA settings and preferred method
    const twoFaStatus = await checkUser2FaStatus(values.email);
    setUser2FaStatus(twoFaStatus);

    if (twoFaStatus.two_factor_enabled) {
      setPendingCredentials({ email: values.email, password: values.password });

      if (twoFaStatus.two_factor_method === "biometric") {
        // Trigger Fingerprint / Face ID immediately
        setIsLoading(false);
        await triggerBiometricVerification(values.email, values.password);
        return;
      }

      if (twoFaStatus.two_factor_method === "both") {
        // Offer choice between Fingerprint and Brevo Email OTP
        setIsLoading(false);
        setStep("choose_method");
        return;
      }

      // Default: Email OTP via Brevo
      const sent = await send2FaEmailOtp(values.email);
      setIsLoading(false);

      if (!sent.success) {
        toast.error(sent.error || "Failed to send 2FA verification code via Brevo.");
        return;
      }

      setStep("otp");
      toast.info("A 6-digit 2FA code was sent via Brevo to your email.");
      return;
    }

    // Standard login without 2FA
    await completeLogin(values.email, values.password);
  };

  const triggerBiometricVerification = async (email: string, pass: string) => {
    setIsLoading(true);
    const bioResult = await authenticateBiometric();
    setIsLoading(false);

    if (bioResult.success) {
      toast.success("Fingerprint / Face ID verified!");
      await completeLogin(email, pass);
    } else {
      toast.error(bioResult.error || "Biometric verification failed.");
      // Fallback to Brevo Email OTP
      const sent = await send2FaEmailOtp(email);
      if (sent.success) {
        setStep("otp");
        toast.info("Switched to Email OTP. Code sent via Brevo.");
      }
    }
  };

  const handleSendEmailOtpChoice = async () => {
    if (!pendingCredentials) return;
    setIsLoading(true);
    const sent = await send2FaEmailOtp(pendingCredentials.email);
    setIsLoading(false);

    if (sent.success) {
      setStep("otp");
      toast.info("A 6-digit code was sent via Brevo to your email.");
    } else {
      toast.error(sent.error || "Failed to send code via Brevo.");
    }
  };

  const handleVerifyOtp = async () => {
    if (!pendingCredentials || otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    const result = await verify2FaEmailOtp(pendingCredentials.email, otpCode);

    if (!result.success) {
      setIsLoading(false);
      toast.error(result.error || "Invalid 2FA code.");
      return;
    }

    toast.success("2FA Code verified!");
    await completeLogin(pendingCredentials.email, pendingCredentials.password);
  };

  const handleResendOtp = async () => {
    if (!pendingCredentials) return;
    setResendingOtp(true);
    const result = await send2FaEmailOtp(pendingCredentials.email);
    setResendingOtp(false);

    if (result.success) {
      toast.success("New 2FA security code sent via Brevo to your email.");
    } else {
      toast.error(result.error || "Failed to resend code.");
    }
  };

  const handleQuickBiometricLogin = async () => {
    setIsLoading(true);
    const savedEmail = getStoredBiometricUserEmail() || form.getValues("email");
    const bioResult = await authenticateBiometric();
    setIsLoading(false);

    if (!bioResult.success) {
      toast.error(bioResult.error || "Fingerprint verification failed.");
      return;
    }

    toast.success("Fingerprint recognized! Please enter your password to unlock.");
    if (savedEmail) {
      form.setValue("email", savedEmail);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-5 py-10">
      {/* Decorative background */}
      <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm space-y-8 animate-slide-up">
        <div className="flex flex-col items-center text-center space-y-3">
          <img src={logo} alt="KukaPay" className="h-12 w-12 rounded-2xl shadow-soft" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {step === "otp"
                ? "Two-Factor Verification"
                : step === "choose_method"
                ? "Choose 2FA Method"
                : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === "otp"
                ? `Enter the 6-digit code sent via Brevo to ${pendingCredentials?.email}`
                : step === "choose_method"
                ? "Select how you would like to complete 2FA verification"
                : "Sign in to your KukaPay account"}
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-card border border-border p-6 shadow-soft space-y-5">
          {step === "credentials" ? (
            <>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@uni.edu.ng"
                          className="h-12 rounded-xl"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Password
                        </FormLabel>
                        <Link to="/forgot-password" className="text-xs text-primary font-semibold hover:underline">
                          Forgot?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-12 rounded-xl pr-12"
                            autoComplete="current-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-semibold active:scale-[0.98] transition-transform"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
                  </Button>
                </form>
              </Form>

              {hasBiometric && (
                <div className="pt-2 border-t border-border text-center space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-dashed gap-2 font-semibold text-sm hover:bg-primary/5 hover:text-primary transition-colors"
                    onClick={handleQuickBiometricLogin}
                    disabled={isLoading}
                  >
                    <Fingerprint className="h-5 w-5 text-primary" />
                    Sign in with Fingerprint / Face ID
                  </Button>
                </div>
              )}
            </>
          ) : step === "choose_method" ? (
            /* Choose 2FA Method Step */
            <div className="space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  className="w-full h-12 rounded-xl gap-2 font-semibold text-sm"
                  onClick={() => pendingCredentials && triggerBiometricVerification(pendingCredentials.email, pendingCredentials.password)}
                  disabled={isLoading}
                >
                  <Fingerprint className="h-5 w-5" />
                  Verify with Fingerprint / Face ID
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl gap-2 font-semibold text-sm"
                  onClick={handleSendEmailOtpChoice}
                  disabled={isLoading}
                >
                  <Mail className="h-5 w-5" />
                  Send 6-Digit Email Code (Brevo)
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 mx-auto pt-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </button>
            </div>
          ) : (
            /* 2FA OTP Step */
            <div className="space-y-6 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <div className="space-y-2 flex flex-col items-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(val) => setOtpCode(val)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-xs text-muted-foreground pt-1">Code sent via Brevo • Expires in 5 mins</p>
              </div>

              <Button
                type="button"
                className="w-full h-12 rounded-xl text-base font-semibold"
                disabled={isLoading || otpCode.length !== 6}
                onClick={handleVerifyOtp}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Sign In"}
              </Button>

              <div className="flex items-center justify-between w-full text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setOtpCode("");
                  }}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendingOtp}
                  className="text-primary font-semibold hover:underline disabled:opacity-50"
                >
                  {resendingOtp ? "Sending..." : "Resend Code"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          New to KukaPay?{" "}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
