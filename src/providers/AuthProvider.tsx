
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signOut: () => Promise<void>;
  updateUserMetadata: (metadata: Record<string, any>) => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: null, data: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  updateUserMetadata: async () => {},
  resetPassword: async () => ({ error: null, data: null }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getActiveSession() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    }

    getActiveSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, currentSession) => {
      console.log("Auth state change:", event);
      
      if (currentSession && event === "SIGNED_IN") {
        setSession(currentSession);
        setUser(currentSession.user);
        toast.success("Signed in successfully!");
      }
      
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        toast.info("Signed out successfully!");
        
        // Clear any locally stored session data to prevent auto-login
        localStorage.removeItem("supabase.auth.token");
      }
      
      if (event === "PASSWORD_RECOVERY") {
        toast.info("Check your email for password reset instructions");
      }
      
      if (event === "USER_UPDATED") {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        toast.success("Your profile has been updated");
      }
      
      // Handle email confirmation
      if (event === "SIGNED_IN" && currentSession?.user?.email_confirmed_at) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        toast.success("Email confirmed successfully!");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data: data.session, error };
  };
  
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          email_template_name: "veno-confirmation"
        }
      }
    });
    
    if (!error) {
      console.log("Signup successful, check email for confirmation link", data);
    }
    
    return { data: data.session, error };
  };
  
  const signOut = async () => {
    await supabase.auth.signOut();
    // Force redirect to auth page after signout
    window.location.href = '/auth';
  };

  const updateUserMetadata = async (metadata: Record<string, any>) => {
    const { error } = await supabase.auth.updateUser({
      data: metadata
    });
    
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    
    return { data, error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateUserMetadata,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
