
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { StreakProvider } from "@/providers/StreakProvider";
import { StreakMissedDialog } from "@/components/streak/StreakMissedDialog";
import { RouteTracker } from "@/components/RouteTracker";
import { routes } from "./App.routes";

import "./functions/appendToActivities";

// Create a new QueryClient instance but make sure it's outside of the component
// to prevent recreation on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Define AppRoutes as a separate component to avoid React Router issues
const AppRoutes = () => {
  const location = useLocation();
  
  // useEffect hook inside the functional component
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const referralCode = searchParams.get('ref');
    
    if (referralCode && location.pathname === '/') {
      sessionStorage.setItem('referralCode', referralCode);
      console.log('Storing referral code and redirecting to signup');
      window.location.href = '/signup?ref=' + referralCode;
    }
  }, [location]);

  return (
    <>
      <RouteTracker />
      <StreakMissedDialog />
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element}>
            {route.children?.map((childRoute, childIndex) => (
              <Route
                key={`${index}-${childIndex}`}
                path={childRoute.path}
                element={childRoute.element}
                index={childRoute.index || undefined}
              >
                {childRoute.children?.map((grandchildRoute, grandchildIndex) => (
                  <Route
                    key={`${index}-${childIndex}-${grandchildIndex}`}
                    path={grandchildRoute.path}
                    element={grandchildRoute.element}
                    index={grandchildRoute.index || undefined}
                  />
                ))}
              </Route>
            ))}
          </Route>
        ))}
      </Routes>
    </>
  );
};

// App component as a proper React function component
const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <StreakProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <AppRoutes />
                </TooltipProvider>
              </StreakProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
