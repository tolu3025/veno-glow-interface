
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
import QuestionBank from "./pages/cbt/QuestionBank";
import TakeTest from "./pages/cbt/TakeTest";
import ManageTest from "./pages/cbt/ManageTest";
import Analytics from "./pages/cbt/Analytics";
import Library from "./pages/cbt/Library";
import Leaderboard from "./pages/cbt/Leaderboard";
import TutorialPage from "./pages/TutorialPage";
import TutorialInfo from "./pages/TutorialInfo";
import OrdersPage from "./pages/OrdersPage";
import BotPage from "./pages/BotPage";
import BlogPage from "./pages/BlogPage";
import NotFound from "./pages/NotFound";
import MainLayout from "./layouts/MainLayout";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AdsPolicy from "./pages/AdsPolicy";
import UnderMaintenancePage from "./pages/UnderMaintenancePage";
import ContactPage from "./pages/ContactPage";
import ServicesPage from "./pages/ServicesPage";
import VideoPlayerPage from "./pages/VideoPlayerPage";

import "./functions/appendToActivities";

const queryClient = new QueryClient();

// Convert the AppRoutes to a proper React function component
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
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage initialMode="signup" />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/ads-policy" element={<AdsPolicy />} />
      <Route path="/maintenance" element={<UnderMaintenancePage />} />
      <Route path="/services" element={<ServicesPage />} />
      
      <Route element={<MainLayout />}>
        {/* Public routes that don't require authentication */}
        <Route path="/" element={<Index />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/cbt/library" element={<Library />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Protected routes that require authentication */}
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
        
        <Route path="/cbt/question-bank" element={
          <ProtectedRoute>
            <QuestionBank />
          </ProtectedRoute>
        } />
        
        <Route path="/cbt/take/:testId" element={
          <ProtectedRoute>
            <TakeTest />
          </ProtectedRoute>
        } />
        
        <Route path="/cbt/leaderboard/:testId" element={
          <ProtectedRoute>
            <Leaderboard />
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
        
        <Route path="/tutorial" element={
          <ProtectedRoute>
            <TutorialPage />
          </ProtectedRoute>
        } />

        <Route path="/tutorial/info" element={
          <ProtectedRoute>
            <TutorialInfo />
          </ProtectedRoute>
        } />
        
        <Route path="/tutorial/watch" element={
          <ProtectedRoute>
            <VideoPlayerPage />
          </ProtectedRoute>
        } />

        <Route path="/orders" element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        } />
        
        <Route path="/bot" element={
          <ProtectedRoute>
            <BotPage />
          </ProtectedRoute>
        } />
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
