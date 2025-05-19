import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { isOnline, testSupabaseConnection, supabase } from "@/integrations/supabase/client";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'educator' | 'moderator' | 'superadmin';
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [offlineMode, setOfflineMode] = useState(false);
  const [dbConnectionStatus, setDbConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  
  const isTestRoute = location.pathname.startsWith('/cbt/take/');

  // Check user role when user is authenticated
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setUserRole(null);
        return;
      }

      setRoleLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          toast({
            title: "Error",
            description: "Could not verify your permissions",
            variant: "destructive",
          });
        } else {
          setUserRole(data?.role || 'user'); // Default to 'user' if no specific role is assigned
        }
      } catch (error) {
        console.error('Unexpected error checking role:', error);
      } finally {
        setRoleLoading(false);
      }
    };

    if (user && requiredRole) {
      checkUserRole();
    }
  }, [user, requiredRole]);

  // Keep connectivity check logic
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

  if (isLoading || (user && requiredRole && roleLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to access this feature",
      variant: "warning",
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If role check is required and user doesn't have sufficient permissions
  if (requiredRole && userRole && userRole !== requiredRole) {
    const rolePriority = {
      'user': 0,
      'moderator': 1,
      'educator': 2,
      'admin': 3,
      'superadmin': 4
    };
    
    // Allow access if user has higher privileges than required
    if ((rolePriority[userRole as keyof typeof rolePriority] || 0) < 
        (rolePriority[requiredRole as keyof typeof rolePriority] || 0)) {
      toast({
        title: "Access Denied",
        description: `You need ${requiredRole} permissions to access this page`,
        variant: "destructive",
      });
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
