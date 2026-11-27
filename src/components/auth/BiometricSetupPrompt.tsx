import { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { registerBiometricCredential } from "@/lib/biometrics";
import { supabase } from "@/integrations/supabase/client";

export const BIOMETRIC_PROMPT_KEY = "kuka_biometric_prompt_dismissed";

interface Props {
  onDone: () => void;
}

/** Offered right after the login PIN so students can unlock with a fingerprint next time. */
const BiometricSetupPrompt = ({ onDone }: Props) => {
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);

  const skip = () => {
    localStorage.setItem(BIOMETRIC_PROMPT_KEY, "1");
    onDone();
  };

  const enable = async () => {
    if (!user) return;
    setBusy(true);
    const result = await registerBiometricCredential(user.id, user.email || "");
    if (!result.success) {
      toast.error(result.error || "We couldn't set up your fingerprint on this device.");
      setBusy(false);
      return;
    }
    try {
      await supabase
        .from("profiles")
        .update({
          biometric_enabled: true,
          biometric_credential_id: result.credentialId ?? null,
        } as never)
        .eq("id", user.id);
      await refreshProfile();
    } catch {
      /* the device credential is what unlocks the app; keep going */
    }
    toast.success("Fingerprint unlock is on for this device.");
    localStorage.setItem(BIOMETRIC_PROMPT_KEY, "1");
    setBusy(false);
    onDone();
  };

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-background">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Fingerprint className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Unlock faster, {firstName}</h2>
          <p className="text-sm text-muted-foreground">
            Use your fingerprint or Face ID to get back into KukaPay instead of typing your
            PIN every time. Your PIN still works whenever you need it.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={enable} disabled={busy} className="w-full h-12">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Fingerprint className="h-4 w-4 mr-2" />}
            Turn on fingerprint / Face ID
          </Button>
          <Button variant="ghost" onClick={skip} disabled={busy} className="w-full text-muted-foreground">
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BiometricSetupPrompt;
