
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

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
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: null, data: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  updateUserMetadata: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getActiveSession() {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      setIsLoading(false);
    }

    getActiveSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (currentSession && event === "SIGNED_IN") {
        setSession(currentSession);
        setUser(currentSession.user);
      }
      
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
      }
      
      if (event === "USER_UPDATED") {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
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
    });
    
    return { data: data.session, error };
  };
  
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateUserMetadata = async (metadata: Record<string, any>) => {
    const { error } = await supabase.auth.updateUser({
      data: metadata
    });
    
    if (error) throw error;
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
