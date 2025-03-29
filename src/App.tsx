
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
import Analytics from "./pages/cbt/Analytics";
import MarketplacePage from "./pages/MarketplacePage";
import BotPage from "./pages/BotPage";
import BlogPage from "./pages/BlogPage";
import NotFound from "./pages/NotFound";
import MainLayout from "./layouts/MainLayout";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RewardSystem from "./pages/RewardSystem";
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
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/cbt" element={<CbtPage />} />
                <Route path="/cbt/take/:testId" element={<TakeTest />} />
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
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/bot" element={<BotPage />} />
                <Route path="/blog" element={<BlogPage />} />
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
