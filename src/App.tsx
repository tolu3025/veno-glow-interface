import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { StreakProvider } from "@/providers/StreakProvider";
import { StreakMissedDialog } from "@/components/streak/StreakMissedDialog";
import { StreakMilestoneDialog } from "@/components/streak/StreakMilestoneDialog";
import { RouteTracker } from "@/components/RouteTracker";
import { InstructionPopup } from "@/components/popups/InstructionPopup";
import AdminSetup from "@/components/AdminSetup";
import Index from "./pages/Index";
import CbtPage from "./pages/cbt/index";
import CreateTest from "./pages/cbt/CreateTest";
import AiCreateTest from "./pages/cbt/AiCreateTest";
import QuestionBank from "./pages/cbt/QuestionBank";
import QuizExplanations from "./pages/cbt/QuizExplanations";
import TakeTest from "./pages/cbt/TakeTest";
import TakeTestByCode from "./pages/cbt/TakeTestByCode";
import ManageTest from "./pages/cbt/ManageTest";
import Analytics from "./pages/cbt/Analytics";
import Library from "./pages/cbt/Library";
import Leaderboard from "./pages/cbt/Leaderboard";
import PublicLeaderboards from "./pages/cbt/PublicLeaderboards";
import TutorialPage from "./pages/TutorialPage";
import TutorialInfo from "./pages/TutorialInfo";
import TutorialCategoriesPage from "./pages/TutorialCategoriesPage";
import OrdersPage from "./pages/OrdersPage";
import BotPage from "./pages/BotPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
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
import StreakAnalyticsPage from "./pages/StreakAnalyticsPage";

import "./functions/appendToActivities";

// Import admin pages
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AssignAdmin from "./pages/admin/AssignAdmin";

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

  // Determine whether to show instruction popups based on the current path
  const showTestInstructions = location.pathname === '/cbt';
  const showQuizInstructions = location.pathname === '/cbt' && location.search.includes('tab=quiz');

  return (
    <>
      <RouteTracker />
      <StreakMissedDialog />
      <StreakMilestoneDialog />
      
      {/* Test Creation Instruction Popup */}
      {showTestInstructions && (
        <InstructionPopup
          id="test-creation-instructions"
          title="Create Custom Tests"
          description={
            <div className="space-y-2">
              <p>Welcome to the CBT platform! Here's how to get started:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Click "Create New Test" to build a custom assessment</li>
                <li>Add your own questions or import them from our question bank</li>
                <li>Set time limits and difficulty levels</li>
                <li>Share your test with others using the generated code</li>
              </ul>
            </div>
          }
          actionText="Create Test"
          actionUrl="/cbt/create"
        />
      )}
      
      {/* Quiz Instruction Popup */}
      {showQuizInstructions && (
        <InstructionPopup
          id="quiz-instructions"
          title="Take a Practice Quiz"
          description={
            <div className="space-y-2">
              <p>Practice makes perfect! Our quiz system helps you improve:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Select your preferred subject and difficulty</li>
                <li>Answer generated questions to test your knowledge</li>
                <li>Track your progress over time</li>
                <li>Earn streak points for consistent practice</li>
              </ul>
            </div>
          }
          actionText="Start Quiz"
          actionUrl="/cbt?tab=quiz"
        />
      )}

      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage initialMode="signup" />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/ads-policy" element={<AdsPolicy />} />
        <Route path="/maintenance" element={<UnderMaintenancePage />} />
        <Route path="/services" element={<ServicesPage />} />
        
        {/* Public test routes - no auth required */}
        <Route path="/test/:shareCode" element={<TakeTestByCode />} />
        <Route path="/cbt/take/:testId" element={<TakeTest />} />
        <Route path="/cbt/leaderboard/:testId" element={<Leaderboard />} />
        
        {/* Admin Routes - IMPORTANT: These must be outside the MainLayout */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="user-management" element={<AdminUserManagement />} />
          <Route path="questions" element={<AdminQuestions />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="assign-admin" element={<AssignAdmin />} />
        </Route>
        
        <Route element={<MainLayout />}>
          {/* Public routes that don't require authentication */}
          <Route path="/" element={<Index />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:postId" element={<BlogPostPage />} />
          <Route path="/cbt/library" element={<Library />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cbt/public-leaderboards" element={<PublicLeaderboards />} />
          <Route path="/tutorial" element={<TutorialPage />} />
          <Route path="/tutorial/info" element={<TutorialInfo />} />
          <Route path="/tutorial/categories" element={<TutorialCategoriesPage />} />
          <Route path="/tutorial/watch" element={<VideoPlayerPage />} />
          
          {/* Bot route - adding it here as a regular route */}
          <Route path="/bot" element={<BotPage />} />
          
          {/* Streak analytics route */}
          <Route path="/streak-analytics" element={<StreakAnalyticsPage />} />
          
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
          
          <Route path="/cbt/create" element={
            <ProtectedRoute>
              <CreateTest />
            </ProtectedRoute>
          } />
          
          <Route path="/cbt/ai-create" element={
            <ProtectedRoute>
              <AiCreateTest />
            </ProtectedRoute>
          } />
          
          <Route path="/cbt/quiz/explanations" element={
            <ProtectedRoute>
              <QuizExplanations />
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
              <ManageTest />
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
        </Route>
        
        <Route path="*" element={<NotFound />} />
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
                  <AdminSetup />
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
