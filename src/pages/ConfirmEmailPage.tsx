import { useState } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

const ConfirmEmailPage = () => {
  const location = useLocation();
  const email: string | undefined = location.state?.email;
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  if (!email) return <Navigate to="/register" replace />;

  const resend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: "https://app.kukapay.com.ng/" },
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Confirmation email sent again — check your inbox and spam folder.");
    setCooldown(60);
    const t = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <MailCheck className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Confirm your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
            Tap the link in that email to activate your KukaPay account, then come back and sign in.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 text-left text-sm text-muted-foreground space-y-1">
          <p>1. Open your email app and look for a message from KukaPay.</p>
          <p>2. Tap <span className="font-medium text-foreground">Confirm your email</span> in that message.</p>
          <p>3. You'll be brought back here to sign in.</p>
        </div>

        <Button className="w-full" asChild>
          <Link to="/login">I've confirmed — take me to sign in</Link>
        </Button>

        <Button variant="outline" className="w-full" onClick={resend} disabled={resending || cooldown > 0}>
          {resending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend confirmation email"}
        </Button>

        <p className="text-xs text-muted-foreground">
          Can't find it? Check your spam/junk folder. Wrong email?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">Register again</Link>
        </p>
      </div>
    </div>
  );
};

export default ConfirmEmailPage;
