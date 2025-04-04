
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
    try {
      // First register the user but don't auto-confirm their email
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Set email confirmation to false (we'll handle it manually)
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        // Log the user out immediately after registration
        await supabase.auth.signOut();
        
        // Generate a confirmation token for the user
        const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email,
          options: {
            redirectTo: `${window.location.origin}/auth`,
          }
        });
        
        if (tokenError) {
          throw tokenError;
        }
        
        if (tokenData?.properties?.action_link) {
          // Send confirmation email using our Brevo edge function
          const confirmationUrl = tokenData.properties.action_link;
          
          const response = await supabase.functions.invoke('brevo-email-confirmation', {
            body: {
              email,
              confirmationUrl
            }
          });
          
          if (response.error) {
            throw new Error(`Failed to send confirmation email: ${response.error.message}`);
          }
          
          console.log("Confirmation email sent successfully");
          return { data: null, error: null, confirmEmailSent: true };
        } else {
          throw new Error("Could not generate confirmation link");
        }
      }
      
      return { data: null, error: null, confirmEmailSent: false };
    } catch (error: any) {
      console.error("Signup error:", error);
      return { data: null, error, confirmEmailSent: false };
    }
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
