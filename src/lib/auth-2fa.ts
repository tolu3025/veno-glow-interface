import { supabase } from "@/integrations/supabase/client";

export interface User2FaStatus {
  two_factor_enabled: boolean;
  biometric_enabled: boolean;
  two_factor_method: "email" | "biometric" | "both";
}

/**
 * Checks whether a given student email has 2FA or Biometrics enabled.
 */
export const checkUser2FaStatus = async (email: string): Promise<User2FaStatus> => {
  const emailLc = email.trim().toLowerCase();
  if (!emailLc) return { two_factor_enabled: false, biometric_enabled: false, two_factor_method: "email" };

  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("two_factor_enabled, biometric_enabled, two_factor_method")
      .eq("id", (await supabase.auth.getUser()).data.user?.id || "")
      .maybeSingle();

    if (prof) {
      return {
        two_factor_enabled: !!(prof as any).two_factor_enabled,
        biometric_enabled: !!(prof as any).biometric_enabled,
        two_factor_method: ((prof as any).two_factor_method as any) || "email",
      };
    }
    return { two_factor_enabled: false, biometric_enabled: false, two_factor_method: "email" };
  } catch (err) {
    console.warn("[auth-2fa] Failed to check 2FA status:", err);
    return { two_factor_enabled: false, biometric_enabled: false, two_factor_method: "email" };
  }
};

/**
 * Generates and dispatches a 6-digit Email OTP via Brevo API for 2FA verification.
 */
export const send2FaEmailOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
  const emailLc = email.trim().toLowerCase();
  if (!emailLc) return { success: false, error: "Email is required." };

  // Generate 6-digit random code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes validity

  try {
    // 1. Insert OTP record into Supabase
    const { error: insertError } = await supabase
      .from("user_2fa_otps" as any)
      .insert({
        email: emailLc,
        otp_code: otpCode,
        expires_at: expiresAt,
        used: false,
      });

    if (insertError) {
      console.error("[auth-2fa] Failed to store OTP record:", insertError);
      return { success: false, error: "Failed to generate security code. Please try again." };
    }

    // 2. Dispatch Email OTP via Brevo Edge Function
    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-2fa-otp", {
        body: { email: emailLc, otp_code: otpCode },
      });
      if (fnError) {
        console.warn("[auth-2fa] Brevo Edge Function warning:", fnError);
      }
    } catch (e) {
      console.warn("[auth-2fa] Brevo dispatch exception:", e);
    }

    return { success: true };
  } catch (err: any) {
    console.error("[auth-2fa] Error sending Brevo 2FA OTP:", err);
    return { success: false, error: err?.message || "Failed to send 2FA security code via Brevo." };
  }
};

/**
 * Verifies the 6-digit Email OTP provided by the user.
 */
export const verify2FaEmailOtp = async (
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> => {
  const emailLc = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!emailLc || cleanCode.length !== 6) {
    return { success: false, error: "Please enter a valid 6-digit verification code." };
  }

  try {
    const nowIso = new Date().toISOString();
    // Query active unused OTP
    const { data, error } = await supabase
      .from("user_2fa_otps" as any)
      .select("id, expires_at, used")
      .eq("email", emailLc)
      .eq("otp_code", cleanCode)
      .eq("used", false)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return { success: false, error: "Invalid or expired security code. Please request a new one." };
    }

    const otpId = (data[0] as any).id as string;
    // Mark code as used
    await supabase
      .from("user_2fa_otps" as any)
      .update({ used: true })
      .eq("id", otpId);

    return { success: true };
  } catch (err: any) {
    console.error("[auth-2fa] OTP verification error:", err);
    return { success: false, error: err?.message || "Verification failed." };
  }
};

/**
 * Enables or updates 2FA settings for the current user.
 */
export const updateUser2FaSettings = async (
  userId: string,
  settings: {
    two_factor_enabled?: boolean;
    two_factor_method?: "email" | "biometric" | "both";
    biometric_enabled?: boolean;
    biometric_credential_id?: string | null;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update(settings as any)
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update 2FA settings." };
  }
};
