
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import Index from "./pages/Index";
import CbtPage from "./pages/cbt/index";
import CreateTest from "./pages/cbt/CreateTest";
import TakeTest from "./pages/cbt/TakeTest";
import ManageTest from "./pages/cbt/ManageTest";
import Analytics from "./pages/cbt/Analytics";
import Library from "./pages/cbt/Library";
import MarketplacePage from "./pages/MarketplacePage";
import BotPage from "./pages/BotPage";
import BlogPage from "./pages/BlogPage";
import NotFound from "./pages/NotFound";
import MainLayout from "./layouts/MainLayout";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RewardSystem from "./pages/RewardSystem";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AdsPolicy from "./pages/AdsPolicy";
import UnderMaintenancePage from "./pages/UnderMaintenancePage";
import ContactPage from "./pages/ContactPage";
import ServicesPage from "./pages/ServicesPage";

// Import our RPC function setup
import "./functions/appendToActivities";

const queryClient = new QueryClient();

// Wrap Route handling in a component that can access hooks
const AppRoutes = () => {
  const location = useLocation();
  
  // Check for referral parameter to handle redirects
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const referralCode = searchParams.get('ref');
    
    if (referralCode && location.pathname === '/') {
      // If there's a referral code on the home page, store it and redirect to signup
      sessionStorage.setItem('referralCode', referralCode);
      console.log('Storing referral code and redirecting to signup');
      window.location.href = '/signup?ref=' + referralCode;
    }
  }, [location]);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage initialMode="signup" />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/ads-policy" element={<AdsPolicy />} />
      <Route path="/maintenance" element={<UnderMaintenancePage />} />
      <Route path="/services" element={<ServicesPage />} />
      
      <Route element={<MainLayout />}>
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/cbt" element={
          <ProtectedRoute>
            <CbtPage />
          </ProtectedRoute>
        } />
        
        <Route path="/cbt/take/:testId" element={
          <ProtectedRoute>
            <TakeTest />
          </ProtectedRoute>
        } />
        
        <Route path="/cbt/create" element={
          <ProtectedRoute>
            <CreateTest />
          </ProtectedRoute>
        } />
        
        <Route path="/cbt/edit/:testId" element={
          <ProtectedRoute>
            <CreateTest />
          </ProtectedRoute>
        } />
        
        <Route path="/cbt/manage/:testId" element={
          <ProtectedRoute>
            <ManageTest />
          </ProtectedRoute>
        } />
        
        <Route path="/cbt/stats/:testId" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        
        <Route path="/cbt/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        
        <Route path="/cbt/library" element={
          <ProtectedRoute>
            <Library />
          </ProtectedRoute>
        } />
        
        <Route path="/rewards" element={
          <ProtectedRoute>
            <RewardSystem />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/marketplace" element={
          <ProtectedRoute>
            <MarketplacePage />
          </ProtectedRoute>
        } />
        
        <Route path="/bot" element={
          <ProtectedRoute>
            <BotPage />
          </ProtectedRoute>
        } />
        
        <Route path="/blog" element={
          <ProtectedRoute>
            <BlogPage />
          </ProtectedRoute>
        } />
        
        <Route path="/contact" element={<ContactPage />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
