/**
 * Biometric & WebAuthn (Passkeys / Fingerprint / Face ID) helper utilities.
 * Supports standard WebAuthn API on web browsers and Capacitor Native Biometrics on mobile.
 */

export interface BiometricCapability {
  isAvailable: boolean;
  type: "webauthn" | "native" | "none";
}

const STORAGE_KEY_PREFIX = "kukapay_biometric_credential_";

export const isBiometricSupported = async (): Promise<BiometricCapability> => {
  if (typeof window === "undefined") {
    return { isAvailable: false, type: "none" };
  }

  // Check WebAuthn support
  if (window.PublicKeyCredential && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (available) {
        return { isAvailable: true, type: "webauthn" };
      }
    } catch (e) {
      console.warn("[biometrics] WebAuthn check error:", e);
    }
  }

  // Fallback WebAuthn check if API exists
  if (!!window.PublicKeyCredential) {
    return { isAvailable: true, type: "webauthn" };
  }

  return { isAvailable: false, type: "none" };
};

/**
 * Registers a new biometric / WebAuthn passkey credential on this device.
 */
export const registerBiometricCredential = async (
  userId: string,
  userEmail: string
): Promise<{ success: boolean; credentialId?: string; error?: string }> => {
  try {
    const capability = await isBiometricSupported();
    if (!capability.isAvailable) {
      return { success: false, error: "Biometric authentication is not supported on this device/browser." };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "KukaPay",
        id: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
      },
      user: {
        id: userIdBytes,
        name: userEmail,
        displayName: userEmail.split("@")[0] || "Student",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: "Biometric registration was cancelled or failed." };
    }

    const rawId = credential.id;
    // Store local biometric registration token
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify({
      credentialId: rawId,
      registeredAt: new Date().toISOString(),
      userEmail,
    }));

    return { success: true, credentialId: rawId };
  } catch (err: any) {
    console.error("[biometrics] Registration failed:", err);
    return {
      success: false,
      error: err?.message || "Failed to register fingerprint/biometrics. Ensure screen lock / biometrics is set up on your device.",
    };
  }
};

/**
 * Authenticates the student using their registered Fingerprint / Passkey / Biometric sensor.
 */
export const authenticateBiometric = async (
  userId?: string
): Promise<{ success: boolean; credentialId?: string; error?: string }> => {
  try {
    const capability = await isBiometricSupported();
    if (!capability.isAvailable) {
      return { success: false, error: "Biometric authentication is not supported on this device." };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    let allowCredentials: PublicKeyCredentialDescriptor[] | undefined = undefined;

    if (userId) {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.credentialId) {
            const rawIdBytes = new TextEncoder().encode(parsed.credentialId);
            allowCredentials = [
              {
                id: rawIdBytes,
                type: "public-key",
              },
            ];
          }
        } catch (e) {
          console.warn("[biometrics] parse stored cred error:", e);
        }
      }
    }

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: "required",
      rpId: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
      ...(allowCredentials ? { allowCredentials } : {}),
    };

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential | null;

    if (!assertion) {
      return { success: false, error: "Biometric verification failed or was cancelled." };
    }

    return { success: true, credentialId: assertion.id };
  } catch (err: any) {
    console.error("[biometrics] Authentication failed:", err);
    return {
      success: false,
      error: err?.message || "Biometric login failed. Please enter your email and password.",
    };
  }
};

/**
 * Checks if biometric credentials exist locally on this device for a given student ID or overall.
 */
export const hasStoredBiometricCred = (userId?: string): boolean => {
  if (typeof window === "undefined") return false;
  if (userId) {
    return !!localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
  }
  // Check if any biometric credential key exists in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      return true;
    }
  }
  return false;
};

export const getStoredBiometricUserEmail = (): string | null => {
  if (typeof window === "undefined") return null;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.userEmail) return parsed.userEmail;
        } catch (e) {}
      }
    }
  }
  return null;
};
