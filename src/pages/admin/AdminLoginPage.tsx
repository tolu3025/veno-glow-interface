import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { getFunctionErrorMessage, invokeAdminOperation } from "@/lib/admin-functions";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"credentials" | "pin">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Check if user has admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Authentication failed");
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      await supabase.auth.signOut();
      toast.error("Access denied: Admin role required");
      setLoading(false);
      return;
    }

    setStep("pin");
    setLoading(false);
  };

  const handlePinVerify = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    const { data, error } = await invokeAdminOperation({ action: "verify_admin_pin", pin });
    setLoading(false);

    if (error || !data?.success) {
      toast.error(getFunctionErrorMessage(data, error, "PIN verification failed"));
      setPin("");
      return;
    }

    sessionStorage.setItem("admin_verified", "true");
    toast.success("Admin access granted");
    navigate("/admin/dashboard");
  };

  const handlePinKey = (key: string) => {
    if (key === "⌫") setPin(pin.slice(0, -1));
    else if (pin.length < 4) setPin(pin + key);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-lg">Admin Access</CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === "credentials" ? "Sign in with admin credentials" : "Enter your transaction PIN"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "credentials" ? (
            <>
              <Input
                type="email"
                placeholder="Admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <Button className="w-full" onClick={handleLogin} disabled={loading || !email || !password}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 justify-center">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-12 w-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                      i < pin.length ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {i < pin.length ? "•" : ""}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key) =>
                  key === "" ? <div key="empty" /> : (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePinKey(key)}
                      className="h-11 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-semibold transition-colors active:scale-95"
                    >
                      {key}
                    </button>
                  )
                )}
              </div>
              <Button className="w-full" onClick={handlePinVerify} disabled={loading || pin.length !== 4}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify PIN"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
