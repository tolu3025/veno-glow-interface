import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { KukaPayLoader } from "@/components/shared/KukaPayLoader";
import { Button } from "@/components/ui/button";

// Handles Supabase auth confirmation links that point to our domain instead of
// the raw supabase project URL. Templates use:
//   https://app.kukapay.com.ng/auth/confirm?token_hash=...&type=<type>&next=/some-path
const AuthConfirmPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token_hash = params.get("token_hash");
    const type = params.get("type") as
      | "recovery"
      | "signup"
      | "invite"
      | "magiclink"
      | "email"
      | "email_change"
      | null;
    const next = params.get("next") || "/";

    if (!token_hash || !type) {
      setError("Invalid or missing confirmation link.");
      return;
    }

    (async () => {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (error) {
        setError(error.message);
        return;
      }
      if (type === "recovery") {
        navigate("/reset-password?recovery=1", { replace: true });
      } else {
        navigate(next, { replace: true });
      }
    })();
  }, [params, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center space-y-3 max-w-sm">
          <h1 className="text-xl font-bold">Link expired or invalid</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => navigate("/forgot-password")}>Request a new link</Button>
        </div>
      </div>
    );
  }

  return <KukaPayLoader isLoading label="Verifying..." />;
};

export default AuthConfirmPage;
