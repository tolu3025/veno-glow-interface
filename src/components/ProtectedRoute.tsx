import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { isOnline, testSupabaseConnection, supabase } from "@/integrations/supabase/client";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [offlineMode, setOfflineMode] = useState(false);
  const [dbConnectionStatus, setDbConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(requireAdmin);
  
  const isTestRoute = location.pathname.startsWith('/cbt/take/');
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    // Check if the user is an admin when required
    const checkAdminStatus = async () => {
      if (requireAdmin && user && !isAdmin) {
        try {
          setIsCheckingAdmin(true);
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            throw error;
          }
          
          const userIsAdmin = data?.role === 'admin';
          setIsAdmin(userIsAdmin);
          
          if (!userIsAdmin && isAdminRoute) {
            toast({
              title: "Access Denied",
              description: "You don't have admin privileges",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } finally {
          setIsCheckingAdmin(false);
        }
      } else if (!requireAdmin) {
        setIsCheckingAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user, requireAdmin, isAdminRoute, isAdmin]);

  useEffect(() => {
    const checkConnectivity = async () => {
      const online = isOnline();
      const wasOffline = offlineMode;
      
      if (!online && !offlineMode) {
        setOfflineMode(true);
        setDbConnectionStatus('disconnected');
        
        toast({
          title: "You're offline",
          description: "Some features may be limited until connection is restored.",
          variant: "warning",
          duration: 5000,
        });
      } else if (online && offlineMode) {
        const result = await testSupabaseConnection();
        
        if (result.success) {
          setOfflineMode(false);
          setDbConnectionStatus('connected');
          
          toast({
            title: "Connection restored",
            description: "You're back online with full functionality.",
            variant: "default",
            duration: 3000,
          });
        } else {
          setOfflineMode(true);
          setDbConnectionStatus('disconnected');
          
          toast({
            title: "Limited connectivity",
            description: "You're online but can't reach our database. Some features will be limited.",
            variant: "warning",
            duration: 5000,
          });
        }
      } else if (online && !wasOffline && dbConnectionStatus === 'unknown') {
        const result = await testSupabaseConnection();
        setDbConnectionStatus(result.success ? 'connected' : 'disconnected');
        
        if (!result.success) {
          toast({
            title: "Database connection issue",
            description: "Unable to connect to our database. Some features may be limited.",
            variant: "warning",
            duration: 5000,
          });
        }
      }
    };
    
    checkConnectivity();
    
    const handleOnline = () => checkConnectivity();
    const handleOffline = () => {
      setOfflineMode(true);
      setDbConnectionStatus('disconnected');
      
      toast({
        title: "You're offline",
        description: "Some features may be limited until connection is restored.",
        variant: "warning",
        duration: 5000,
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const intervalId = setInterval(() => {
      if (isOnline() && dbConnectionStatus === 'disconnected') {
        checkConnectivity();
      }
    }, 60000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [offlineMode, dbConnectionStatus]);

  if (isLoading || isCheckingAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    // Show authentication toast for protected routes
    toast({
      title: "Authentication Required",
      description: "Please sign in to access this feature",
      variant: "warning",
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if admin privileges are required and the user doesn't have them
  if (requireAdmin && isAdmin === false) {
    toast({
      title: "Access Denied",
      description: "You don't have permission to access this area",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
