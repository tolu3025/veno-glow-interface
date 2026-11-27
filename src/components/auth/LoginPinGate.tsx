import { useState } from "react";
import { Delete, Loader2, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyInvoke } from "@/lib/friendlyInvoke";

interface LoginPinGateProps {
  onVerified: () => void;
  heading?: string;
  subtitle?: string;
  alert?: string;
}

const LoginPinGate = ({ onVerified, heading, subtitle, alert }: LoginPinGateProps) => {
  const { profile, signOut } = useAuth();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (enteredPin: string) => {
    if (enteredPin.length !== 4) return;
    setLoading(true);

    try {
      // Check lockout first
      const { data: lockoutData } = await supabase.rpc("check_pin_lockout", {
        p_user_id: profile!.id,
      });
      if ((lockoutData as any)?.locked) {
        toast.error((lockoutData as any).message || "Account locked. Try again later.");
        setPin("");
        setLoading(false);
        return;
      }

      try {
        await friendlyInvoke("verify-login-pin", { body: { pin: enteredPin } }, "Incorrect PIN");
      } catch (e: any) {
        await supabase.rpc("record_failed_pin", { p_user_id: profile!.id });
        toast.error(e.message);
        setPin("");
        setLoading(false);
        return;
      }

      // Reset attempts on success
      await supabase.rpc("reset_pin_attempts", { p_user_id: profile!.id });

      // Store session verification flag
      sessionStorage.setItem("kuka_pin_verified", "true");
      onVerified();
    } catch {
      toast.error("Verification failed. Try again.");
      setPin("");
    }
    setLoading(false);
  };

  const handleKey = (key: string) => {
    if (loading) return;
    if (key === "del") {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < 4) {
      const next = pin + key;
      setPin(next);
      if (next.length === 4) {
        handleVerify(next);
      }
    }
  };

  const firstName = profile?.full_name?.split(" ")[0] || "User";

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">{heading || `Welcome back, ${firstName}`}</h2>
          <p className="text-sm text-muted-foreground">
            {subtitle || "Enter your 4-digit PIN to continue"}
          </p>
          {alert && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
              {alert}
            </p>
          )}
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                i < pin.length
                  ? "bg-primary border-primary scale-110"
                  : "border-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* PIN pad */}
        <div className="grid grid-cols-3 gap-3 w-64 mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
            (key) =>
              key === "" ? (
                <div key="empty" />
              ) : (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  disabled={loading}
                  className="h-14 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center text-lg font-semibold transition-colors active:scale-95 disabled:opacity-50"
                >
                  {key === "del" ? <Delete className="h-5 w-5" /> : key}
                </button>
              )
          )}
        </div>

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full text-muted-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
};

export default LoginPinGate;
