import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Delete, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { toast } from "sonner";

const SetLoginPinPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { profile, refreshProfile } = useAuth();
  const changing = params.get("change") === "1";

  // Never ask an account that already has a PIN to create a new one.
  useEffect(() => {
    if (!changing && profile?.has_login_pin) {
      navigate("/", { replace: true });
    }
  }, [changing, profile?.has_login_pin, navigate]);

  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const current = step === "create" ? pin : confirmPin;
  const setCurrent = step === "create" ? setPin : setConfirmPin;

  const submit = async (finalConfirm: string) => {
    if (finalConfirm !== pin) {
      toast.error("PINs don't match. Try again.");
      setConfirmPin("");
      setStep("create");
      setPin("");
      return;
    }
    setLoading(true);
    try {
      await friendlyInvoke("set-login-pin", { body: { pin } }, "Couldn't save PIN");
      sessionStorage.setItem("kuka_pin_verified", "true");
      toast.success("Login PIN set");
      await refreshProfile();
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e.message);
      setConfirmPin("");
      setPin("");
      setStep("create");
    }
    setLoading(false);
  };

  const handleKey = (key: string) => {
    if (loading) return;
    if (key === "del") {
      setCurrent(current.slice(0, -1));
      return;
    }
    if (current.length >= 4) return;
    const next = current + key;
    setCurrent(next);
    if (next.length === 4) {
      if (step === "create") {
        setTimeout(() => setStep("confirm"), 150);
      } else {
        submit(next);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">
            {step === "create" ? "Create a login PIN" : "Confirm your PIN"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {step === "create"
              ? "The installed app requires a 4-digit PIN for quick, secure sign-in."
              : "Enter the same 4-digit PIN again."}
          </p>
        </div>

        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                i < current.length ? "bg-primary border-primary scale-110" : "border-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 w-64 mx-auto">
          {["1","2","3","4","5","6","7","8","9","","0","del"].map((key) =>
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
      </div>
    </div>
  );
};

export default SetLoginPinPage;
