import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, LogOut, ChevronRight, Key,
  CheckCircle, Clock, Loader2, Camera,
  MessageCircle, Mail, HelpCircle, Fingerprint,
  Smartphone, MailCheck, Lock, Check,
} from "lucide-react";
import { SUPPORT_WHATSAPP, SUPPORT_WHATSAPP_LINK, SUPPORT_EMAIL, SUPPORT_EMAIL_LINK } from "@/lib/support";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { recordSecurityLog } from "@/lib/security-log";
import { send2FaEmailOtp, verify2FaEmailOtp, updateUser2FaSettings } from "@/lib/auth-2fa";
import { isBiometricSupported, registerBiometricCredential } from "@/lib/biometrics";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [showPinChange, setShowPinChange] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [changePinStep, setChangePinStep] = useState<"current" | "new" | "confirm">("current");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const hasPin = !!profile?.has_transaction_pin;

  // 2FA & Biometric states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"email" | "biometric" | "both">("email");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [twoFaOtpCode, setTwoFaOtpCode] = useState("");
  const [is2faLoading, setIs2faLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setTwoFactorEnabled(!!profile.two_factor_enabled);
      setTwoFactorMethod(profile.two_factor_method || "email");
      setBiometricEnabled(!!profile.biometric_enabled);
    }
    isBiometricSupported().then((res) => {
      setBiometricSupported(res.isAvailable);
    });
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploadingAvatar(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").update({ avatar_url: avatarUrl } as any).eq("id", user.id);
    await refreshProfile();
    setUploadingAvatar(false);
    toast.success("Profile picture updated!");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelect2FaMethod = async (method: "email" | "biometric" | "both") => {
    if (!user || !user.email) return;

    if (method === "biometric" || method === "both") {
      if (!biometricEnabled) {
        // Must register biometric first
        setIs2faLoading(true);
        const bioRes = await registerBiometricCredential(user.id, user.email);
        if (!bioRes.success) {
          setIs2faLoading(false);
          toast.error(bioRes.error || "Could not register fingerprint / Face ID.");
          return;
        }
        setBiometricEnabled(true);
      }
    }

    if (method === "email" || method === "both") {
      if (!twoFactorEnabled) {
        // Send Brevo OTP confirmation first
        setIs2faLoading(true);
        const res = await send2FaEmailOtp(user.email);
        setIs2faLoading(false);

        if (!res.success) {
          toast.error(res.error || "Failed to send verification code via Brevo.");
          return;
        }

        setTwoFactorMethod(method);
        setIs2faModalOpen(true);
        setTwoFaOtpCode("");
        toast.info(`Brevo verification code sent to ${user.email}`);
        return;
      }
    }

    // Direct update if 2FA already enabled
    setIs2faLoading(true);
    const res = await updateUser2FaSettings(user.id, {
      two_factor_enabled: true,
      two_factor_method: method,
      biometric_enabled: method === "biometric" || method === "both" || biometricEnabled,
    });
    setIs2faLoading(false);

    if (res.success) {
      setTwoFactorEnabled(true);
      setTwoFactorMethod(method);
      await refreshProfile();
      toast.success(`2FA preference updated to ${method === "email" ? "Email OTP" : method === "biometric" ? "Fingerprint / Face ID" : "Flexible (Both)"}.`);
    } else {
      toast.error(res.error || "Failed to update 2FA method.");
    }
  };

  const handleToggle2Fa = async (checked: boolean) => {
    if (!user || !user.email) return;

    if (!checked) {
      // Disable 2FA
      setIs2faLoading(true);
      const res = await updateUser2FaSettings(user.id, { two_factor_enabled: false });
      setIs2faLoading(false);
      if (res.success) {
        setTwoFactorEnabled(false);
        await refreshProfile();
        toast.success("Two-Factor Authentication disabled.");
      } else {
        toast.error(res.error || "Failed to disable 2FA.");
      }
      return;
    }

    // Enable 2FA with current method choice
    await handleSelect2FaMethod(twoFactorMethod);
  };

  const handleConfirmEnable2Fa = async () => {
    if (!user || !user.email || twoFaOtpCode.length !== 6) return;

    setIs2faLoading(true);
    const verifyRes = await verify2FaEmailOtp(user.email, twoFaOtpCode);

    if (!verifyRes.success) {
      setIs2faLoading(false);
      toast.error(verifyRes.error || "Invalid security code.");
      return;
    }

    const updateRes = await updateUser2FaSettings(user.id, {
      two_factor_enabled: true,
      two_factor_method: twoFactorMethod,
    });
    setIs2faLoading(false);

    if (updateRes.success) {
      setTwoFactorEnabled(true);
      setIs2faModalOpen(false);
      await refreshProfile();
      await recordSecurityLog({ user_id: user.id, action: "2fa_enabled" });
      toast.success("2-Factor Authentication enabled successfully!");
    } else {
      toast.error(updateRes.error || "Failed to save 2FA settings.");
    }
  };

  const handleChangePin = async () => {
    if (!hasPin) {
      if (changePinStep === "current") {
        setChangePinStep("new");
        return;
      }
      if (changePinStep === "new") {
        if (newPin.length !== 4) return;
        setChangePinStep("confirm");
        return;
      }
      if (confirmPin !== newPin) {
        toast.error("PINs don't match");
        setChangePinStep("new"); setNewPin(""); setConfirmPin("");
        return;
      }
      setPinLoading(true);
      try {
        await friendlyInvoke("p2p-transfer", { body: { action: "set_pin", pin: newPin } }, "Failed to set PIN");
        toast.success("Transaction PIN set!");
        resetPinForm();
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setPinLoading(false);
      }
      return;
    }

    if (changePinStep === "current") {
      if (currentPin.length !== 4) return;
      setChangePinStep("new");
      return;
    }
    if (changePinStep === "new") {
      if (newPin.length !== 4) return;
      setChangePinStep("confirm");
      return;
    }
    if (confirmPin !== newPin) {
      toast.error("PINs don't match");
      setChangePinStep("new");
      setNewPin("");
      setConfirmPin("");
      return;
    }
    setPinLoading(true);
    try {
      await friendlyInvoke("p2p-transfer", {
        body: { action: "change_pin", current_pin: currentPin, new_pin: newPin },
      }, "Failed to change PIN");
      toast.success("Transaction PIN changed!");
      await recordSecurityLog({ user_id: user!.id, action: "pin_change" });
      resetPinForm();
    } catch (e: any) {
      toast.error(e.message);
      if (/incorrect current pin/i.test(e.message)) {
        setChangePinStep("current");
        setCurrentPin("");
      }
    } finally {
      setPinLoading(false);
    }
  };

  const resetPinForm = () => {
    setShowPinChange(false);
    setChangePinStep("current");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  };

  const handleSignOut = async () => {
    if (user) {
      await recordSecurityLog({ user_id: user.id, action: "logout" });
    }
    await signOut();
    navigate("/login");
  };

  const PinInput = ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
  }) => {
    const handleKey = (key: string) => {
      if (key === "⌫") onChange(value.slice(0, -1));
      else if (value.length < 4) onChange(value + key);
    };
    return (
      <div className="space-y-3">
        {label && <label className="text-sm font-medium">{label}</label>}
        <div className="flex gap-3 justify-center">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-12 w-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                i < value.length
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
            >
              {i < value.length ? "•" : ""}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key) =>
            key === "" ? <div key="empty" /> : (
              <button
                key={key}
                type="button"
                onClick={() => handleKey(key)}
                className="h-11 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-semibold transition-colors active:scale-95"
              >
                {key}
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="px-5 pt-10 pb-24 space-y-5 max-w-md mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Profile & Security</h1>
        <p className="text-sm text-muted-foreground">Manage your account and 2FA options</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-14 w-14">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                  {profile?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-background hover:bg-primary/90 transition-colors"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-3 w-3 animate-spin text-primary-foreground" />
                ) : (
                  <Camera className="h-3 w-3 text-primary-foreground" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="font-bold">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile?.matric_number}</p>
              <p className="text-xs text-muted-foreground">{profile?.university}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={profile?.kyc_status === "verified" ? "default" : "secondary"}>
              {profile?.kyc_status === "verified" ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> KYC Verified</>
              ) : (
                <><Clock className="h-3 w-3 mr-1" /> KYC {profile?.kyc_status}</>
              )}
            </Badge>

            {twoFactorEnabled && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Shield className="h-3 w-3 mr-1" /> 2FA Active ({twoFactorMethod})
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" /> Two-Factor Authentication (2FA)
          </h2>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2Fa}
            disabled={is2faLoading}
          />
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Choose your preferred 2FA verification method:</p>

            <div className="space-y-2">
              {/* Option 1: Email OTP */}
              <button
                type="button"
                onClick={() => handleSelect2FaMethod("email")}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  twoFactorMethod === "email"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MailCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Email OTP (Brevo)</p>
                    <p className="text-xs text-muted-foreground">Receive a 6-digit code via email on sign-in</p>
                  </div>
                </div>
                {twoFactorMethod === "email" && <Check className="h-4 w-4 text-primary" />}
              </button>

              {/* Option 2: Fingerprint / Face ID */}
              <button
                type="button"
                onClick={() => handleSelect2FaMethod("biometric")}
                disabled={!biometricSupported}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  twoFactorMethod === "biometric"
                    ? "border-accent bg-accent/5 ring-1 ring-accent"
                    : "border-border hover:bg-muted/40"
                } ${!biometricSupported ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Fingerprint / Face ID</p>
                    <p className="text-xs text-muted-foreground">
                      {biometricSupported ? "Use your device biometric sensor" : "Not supported on this browser"}
                    </p>
                  </div>
                </div>
                {twoFactorMethod === "biometric" && <Check className="h-4 w-4 text-accent" />}
              </button>

              {/* Option 3: Flexible (Both / Either) */}
              <button
                type="button"
                onClick={() => handleSelect2FaMethod("both")}
                disabled={!biometricSupported}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  twoFactorMethod === "both"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/40"
                } ${!biometricSupported ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-foreground">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Flexible (Either Email or Fingerprint)</p>
                    <p className="text-xs text-muted-foreground">Choose your verification method dynamically during login</p>
                  </div>
                </div>
                {twoFactorMethod === "both" && <Check className="h-4 w-4 text-primary" />}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm flex items-center gap-1.5">
          <Lock className="h-4 w-4" /> Security & Account
        </h2>

        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {/* Change Transaction PIN */}
            <button
              onClick={() => {
                if (!showPinChange) {
                  setChangePinStep(hasPin ? "current" : "new");
                }
                setShowPinChange(!showPinChange);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium">Transaction PIN</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.has_transaction_pin ? "Change your PIN" : "Set up your PIN"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* KYC Verification */}
            <button
              onClick={() => navigate("/kyc")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium">Identity Verification</p>
                  <p className="text-xs text-muted-foreground">KYC Level {profile?.kyc_level}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Recent activity / sessions */}
            <button
              onClick={() => navigate("/security/activity")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium">Recent activity</p>
                  <p className="text-xs text-muted-foreground">See where your account was used</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* PIN Change Form */}
      {showPinChange && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm text-center">
              {!hasPin
                ? (changePinStep === "new" ? "Create Transaction PIN" : "Confirm PIN")
                : (changePinStep === "current" ? "Enter Current PIN" :
                   changePinStep === "new" ? "Enter New PIN" : "Confirm New PIN")}
            </h3>
            <PinInput
              value={changePinStep === "current" ? currentPin : changePinStep === "new" ? newPin : confirmPin}
              onChange={changePinStep === "current" ? setCurrentPin : changePinStep === "new" ? setNewPin : setConfirmPin}
              label=""
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={resetPinForm}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleChangePin}
                disabled={pinLoading || (changePinStep === "current" ? currentPin.length !== 4 : changePinStep === "new" ? newPin.length !== 4 : confirmPin.length !== 4)}
              >
                {pinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : changePinStep === "confirm" ? "Change PIN" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2FA Brevo Email Setup Confirmation Modal */}
      {is2faModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6 space-y-5 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <MailCheck className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-lg">Verify Email via Brevo</h3>
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code sent to <strong>{user?.email}</strong> to activate 2FA.
                </p>
              </div>

              <div className="flex justify-center py-2">
                <InputOTP
                  maxLength={6}
                  value={twoFaOtpCode}
                  onChange={(v) => setTwoFaOtpCode(v)}
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
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setIs2faModalOpen(false)}
                  disabled={is2faLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 font-semibold"
                  onClick={handleConfirmEnable2Fa}
                  disabled={is2faLoading || twoFaOtpCode.length !== 6}
                >
                  {is2faLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm 2FA"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Support */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4" /> Need Help?
        </h2>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            <a
              href={SUPPORT_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm font-medium">WhatsApp Support</p>
                  <p className="text-xs text-muted-foreground">{SUPPORT_WHATSAPP}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href={SUPPORT_EMAIL_LINK}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-xs text-muted-foreground">{SUPPORT_EMAIL}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Sign Out */}
      <Button variant="destructive" className="w-full gap-2" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
};

export default ProfilePage;
