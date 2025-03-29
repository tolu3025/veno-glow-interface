
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/cbt" element={<CbtPage />} />
              <Route path="/cbt/create" element={<CreateTest />} />
              <Route path="/cbt/take/:testId" element={<TakeTest />} />
              <Route path="/cbt/edit/:testId" element={<CreateTest />} />
              <Route path="/cbt/stats/:testId" element={<Analytics />} />
              <Route path="/cbt/analytics" element={<Analytics />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/bot" element={<BotPage />} />
              <Route path="/blog" element={<BlogPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
