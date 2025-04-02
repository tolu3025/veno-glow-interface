
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Check if the route is a test-taking route
  const isTestRoute = location.pathname.startsWith('/cbt/take/');

  useEffect(() => {
    const checkOnlineStatus = () => {
      const isOnline = navigator.onLine;
      
      if (!isOnline && !offlineMode) {
        setOfflineMode(true);
        
        toast({
          title: "You're offline",
          description: "Some features may be limited until connection is restored.",
          variant: "warning",
          duration: 5000,
        });
      } else if (isOnline && offlineMode) {
        setOfflineMode(false);
        
        toast({
          title: "Connection restored",
          description: "You're back online.",
          variant: "default",
          duration: 3000,
        });
      }
    };
    
    // Check initial status
    checkOnlineStatus();
    
    // Set up event listeners
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, [offlineMode]);

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

  if (!user) {
    // If offline, show limited functionality warning but don't redirect
    if (!navigator.onLine) {
      toast({
        title: "Limited functionality",
        description: "Full access requires login. Some features will be unavailable while offline.",
        variant: "warning",
        duration: 5000,
      });
      return <>{children}</>;
    }
    
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
