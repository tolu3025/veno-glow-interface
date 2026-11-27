import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearSessionRisk } from "@/lib/session-risk";

interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  university: string;
  matric_number: string;
  kyc_status: "pending" | "submitted" | "verified" | "rejected" | "unverified";
  kyc_level: number;
  face_match_score: number | null;
  has_transaction_pin: boolean;
  has_login_pin: boolean;
  failed_pin_attempts: number;
  pin_locked_until: string | null;
  avatar_url: string | null;
  is_suspended: boolean;
  suspended_reason: string | null;
  matric_flagged_at: string | null;
  matric_correction_deadline: string | null;
  two_factor_enabled?: boolean;
  two_factor_method?: "email" | "biometric" | "both";
  biometric_enabled?: boolean;
  biometric_credential_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  virtual_account_number: string | null;
  virtual_bank_name: string | null;
  flutterwave_reference: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  wallet: Wallet | null;
  loading: boolean;
  refreshWallet: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, metadata: {
    full_name: string;
    phone_number: string;
    university: string;
    matric_number: string;
  }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const CORE_PROFILE_COLUMNS = "id, full_name, phone_number, university, matric_number, kyc_status, kyc_level, face_match_score, failed_pin_attempts, pin_locked_until, is_suspended, suspended_reason, matric_flagged_at, matric_correction_deadline, transaction_pin_hash, login_pin_hash, avatar_url, created_at, updated_at";
const PROFILE_COLUMNS = `${CORE_PROFILE_COLUMNS}, two_factor_enabled, two_factor_method, biometric_enabled, biometric_credential_id`;

const shapeProfile = (data: any): Profile => {
  // Convert hash presence to boolean — never expose the actual hash values
  const { transaction_pin_hash, login_pin_hash, ...safeData } = data;
  return {
    ...safeData,
    has_transaction_pin: !!transaction_pin_hash,
    has_login_pin: !!login_pin_hash,
  } as Profile;
};

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .single();
  if (!error && data) return shapeProfile(data);

  // Never let one optional column break the whole account load (blank name,
  // skipped PIN gate). Retry with the columns the app cannot work without.
  console.warn("[auth] full profile load failed, retrying core columns:", error);
  const fallback = await supabase
    .from("profiles")
    .select(CORE_PROFILE_COLUMNS)
    .eq("id", userId)
    .single();
  if (fallback.error || !fallback.data) return null;
  return shapeProfile(fallback.data);
};

const fetchWallet = async (userId: string): Promise<Wallet | null> => {
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data as Wallet;
};

const withTimeout = <T,>(promise: Promise<T>, ms = 4000): Promise<T | null> => {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (userId: string) => {
    try {
      const [p, w] = await Promise.all([
        withTimeout(fetchProfile(userId), 4000).catch((error) => {
          console.warn("[auth] profile load failed:", error);
          return null;
        }),
        withTimeout(fetchWallet(userId), 4000).catch((error) => {
          console.warn("[auth] wallet load failed:", error);
          return null;
        }),
      ]);
      setProfile(p);
      setWallet(w);
    } catch (e) {
      console.warn("[auth] loadUserData failed:", e);
    }
  };

  const refreshWallet = async () => {
    if (user) {
      const w = await fetchWallet(user.id);
      setWallet(w);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error("[auth] initial session restore failed:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          loadUserData(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setProfile(null);
          setWallet(null);
          if (mounted) setLoading(false);
        }
      }
    );

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!mounted) return;
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadUserData(session.user.id);
          }
        } catch (error) {
          console.warn("[auth] visibility session refresh failed:", error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Live-sync profile changes (KYC approvals/rejections) for the current user.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const next = payload.new as Profile;
          setProfile((prev) => {
            if (prev && next.kyc_status === "verified" && prev.kyc_status !== "verified") {
              try {
                // Deferred import avoids a top-level cycle with toast provider.
                import("sonner").then(({ toast }) =>
                  toast.success(`Level ${next.kyc_level} KYC approved!`, {
                    description: "You can now access your dashboard.",
                  }),
                );
              } catch {}
            }
            if (prev && next.kyc_status === "rejected" && prev.kyc_status !== "rejected") {
              try {
                import("sonner").then(({ toast }) =>
                  toast.error("KYC submission rejected", {
                    description: "Please review the admin note and resubmit.",
                  }),
                );
              } catch {}
            }
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);


  const signUp = async (
    email: string,
    password: string,
    metadata: {
      full_name: string;
      phone_number: string;
      university: string;
      matric_number: string;
    }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: "https://app.kukapay.com.ng/",
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const emailLc = email.trim().toLowerCase();

    const formatLock = (until: string) => {
      const ms = Math.max(0, new Date(until).getTime() - Date.now());
      const mins = Math.max(1, Math.ceil(ms / 60_000));
      return new Error(`Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`);
    };

    // 0. Drop any stale local session so a leftover/invalid refresh token
    // doesn't make a valid login look like "invalid credentials".
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {
      console.warn("[signIn] local signOut before login failed:", e);
    }

    // 1. Pre-check lock — fail-open if RPC errors so a broken RPC never
    // blocks valid logins.
    try {
      const { data: lock, error: lockErr } = await supabase.rpc("check_login_lock", { _email: emailLc });
      if (!lockErr && (lock as any)?.locked) {
        return { error: formatLock((lock as any).locked_until) };
      }
    } catch (e) {
      console.warn("[signIn] check_login_lock unavailable:", e);
    }

    // 2. Attempt sign-in with normalized email.
    const { error } = await supabase.auth.signInWithPassword({ email: emailLc, password });

    // Recognise the actual "bad credentials" response so we don't relabel
    // other errors (email not confirmed, rate limit, refresh token, etc.)
    // as "invalid email or password".
    const rawMsg = error?.message ?? "";
    const isBadCredentials =
      !!error &&
      (/invalid login credentials/i.test(rawMsg) ||
        (error as any)?.code === "invalid_credentials");

    // 3. Record outcome — also fail-open. Only count a failure when it's
    // actually a bad-credentials failure so transient errors don't burn
    // the user's lockout budget.
    let rec: any = null;
    if (!error || isBadCredentials) {
      try {
        const { data } = await supabase.rpc("record_login_attempt", {
          _email: emailLc,
          _success: !error,
        });
        rec = data;
      } catch (e) {
        console.warn("[signIn] record_login_attempt unavailable:", e);
      }
    }

    if (error) {
      if (rec?.locked) {
        return { error: formatLock(rec.locked_until) };
      }
      if (isBadCredentials) {
        const left = rec?.attempts_left;
        if (typeof left === "number" && left <= 3) {
          return { error: new Error(`Invalid email or password. ${left} attempt${left === 1 ? "" : "s"} left before lockout.`) };
        }
        return { error: new Error("Invalid email or password.") };
      }
      // Surface the real Supabase message (email not confirmed, rate limit, etc.).
      return { error: new Error(rawMsg || "Sign-in failed. Please try again.") };
    }
    return { error: null };
  };

  const signOut = async () => {
    clearSessionRisk();
    sessionStorage.removeItem("kuka_pin_verified");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setWallet(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, wallet, loading, refreshWallet, refreshProfile, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
