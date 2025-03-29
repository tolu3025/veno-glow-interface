
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import Index from "./pages/Index";
import CbtPage from "./pages/cbt/index";
import CreateTest from "./pages/cbt/CreateTest";
import TakeTest from "./pages/cbt/TakeTest";
import ManageTest from "./pages/cbt/ManageTest";
import Analytics from "./pages/cbt/Analytics";
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

// Import our RPC function setup
import "./functions/appendToActivities";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                
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
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
