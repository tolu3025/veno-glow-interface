
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
    confirmEmailSent: boolean;
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
  signUp: async () => ({ error: null, data: null, confirmEmailSent: false }),
  signOut: async () => {},
  updateUserMetadata: async () => {},
  resetPassword: async () => ({ error: null, data: null }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, currentSession) => {
      console.log("Auth state change:", event);
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
      } else {
        setSession(null);
        setUser(null);
      }
      
      // Handle specific auth events with toasts
      if (event === "SIGNED_IN") {
        toast.success("Signed in successfully!");
      } else if (event === "SIGNED_OUT") {
        toast.info("Signed out successfully!");
        // Clear any locally stored session data to prevent auto-login
        localStorage.removeItem("supabase.auth.token");
      } else if (event === "PASSWORD_RECOVERY") {
        toast.info("Check your email for password reset instructions");
      } else if (event === "USER_UPDATED") {
        toast.success("Your profile has been updated");
      } else if (event === "SIGNED_IN" && currentSession?.user?.email_confirmed_at) {
        toast.success("Email confirmed successfully!");
      }
    });

    // THEN check for existing session
    const initializeAuth = async () => {
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
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { data: data.session, error };
    } catch (err) {
      console.error("Sign in error:", err);
      return { data: null, error: err instanceof Error ? err : new Error("Unknown error") };
    }
  };
  
  const signUp = async (email: string, password: string) => {
    try {
      // First check if the email already exists
      const { data: userExists } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (userExists) {
        toast.error("This email is already registered. Please sign in instead.");
        return { 
          data: null, 
          error: new Error("Email already registered"), 
          confirmEmailSent: false
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Send custom confirmation email through our edge function
      if (data.user && !data.session) {
        try {
          // Get the confirmation URL from Supabase's session data
          const confirmUrl = `${window.location.origin}/auth?confirmation=true&email=${encodeURIComponent(email)}`;
          
          console.log("Sending confirmation email to:", email);
          console.log("With confirmation URL:", confirmUrl);
          
          // Call our custom email function
          const response = await supabase.functions.invoke('brevo-email-confirmation', {
            body: {
              email: email,
              name: data.user.user_metadata?.full_name || '',
              confirmationUrl: confirmUrl
            }
          });

          console.log("Email function response:", response);

          if (response.error) {
            console.error('Error sending confirmation email:', response.error);
            toast.error('Error sending confirmation email. Please try again.');
          } else {
            toast.success('Confirmation email sent. Please check your inbox.');
          }
        } catch (emailError) {
          console.error('Error invoking email function:', emailError);
        }
      }
      
      return { 
        data: data.session, 
        error: null, 
        confirmEmailSent: data.user && !data.session 
      };
    } catch (error: any) {
      console.error("Signup error:", error);
      return { data: null, error, confirmEmailSent: false };
    }
  };
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Force redirect to auth page after signout
      window.location.href = '/auth';
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out properly. Please try again.");
    }
  };

  const updateUserMetadata = async (metadata: Record<string, any>) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata
      });
      
      if (error) throw error;
    } catch (error) {
      console.error("Error updating user metadata:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      return { data, error };
    } catch (error) {
      console.error("Error resetting password:", error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error("Failed to reset password") 
      };
    }
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
