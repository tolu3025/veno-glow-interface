
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { isOnline, testSupabaseConnection } from "@/integrations/supabase/client";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, session } = useAuth();
  const location = useLocation();
  const [offlineMode, setOfflineMode] = useState(false);
  const [dbConnectionStatus, setDbConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  // Check if the route is a test-taking route
  const isTestRoute = location.pathname.startsWith('/cbt/take/');
  
  // Track authentication status
  const [authChecked, setAuthChecked] = useState(false);

  // Handle online/offline status and database connectivity
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
        // When coming back online, test actual database connection
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
          // Still offline at the database level
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
        // Initial connection test when already online
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
    
    // Check initial status
    checkConnectivity();
    
    // Set up event listeners
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
    
    // Check database connectivity every minute when online
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

  // Mark auth as checked once loading is complete
  useEffect(() => {
    if (!isLoading) {
      setAuthChecked(true);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Allow access to test routes even if user is not logged in
  if (isTestRoute) {
    return <>{children}</>;
  }

  // Double-check auth status
  if (!user && authChecked) {
    // If offline or database unreachable, show limited functionality warning but don't redirect
    if (offlineMode || dbConnectionStatus === 'disconnected') {
      toast({
        title: "Limited functionality",
        description: "Full access requires login. Some features will be unavailable while offline.",
        variant: "warning",
        duration: 5000,
      });
      return <>{children}</>;
    }
    
    // Actual session validation
    if (!session && !isLoading) {
      // Redirect to auth page with the current location as a return destination
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
