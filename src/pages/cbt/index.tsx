
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, BookOpen, Trophy, Share2, BarChart3, Moon, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import QuizSection from "@/components/cbt/QuizSection";
import MyTestsSection from "@/components/cbt/MyTestsSection";
import AppNavigation from "@/components/cbt/AppNavigation";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { VenoLogo } from "@/components/ui/logo";
import { useTheme } from "@/providers/ThemeProvider";

const CbtPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(() => {
    // Get tab from URL query params or default to 'quiz'
    const params = new URLSearchParams(location.search);
    return params.get('tab') || "quiz";
  });
  
  const handleCreateTest = () => {
    navigate("/cbt/create");
  };

  const handleShare = async (testId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/cbt/take/${testId}`);
      toast({
        title: "Link copied!",
        description: "Share this link with others to take your test",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('tab', activeTab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [activeTab]);

  return (
    <div className="pb-20 md:pb-6 md:pl-64">
      {/* App Navigation */}
      <AppNavigation />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <VenoLogo className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Veno</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          
          <Button onClick={handleCreateTest} variant="default" size={isMobile ? "sm" : "default"} className="bg-veno-primary hover:bg-veno-primary/90">
            <Plus size={16} className="mr-1" /> Create Test
          </Button>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="quiz" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
              <BookOpen size={16} className="mr-2" /> Quiz Library
            </TabsTrigger>
            <TabsTrigger value="mytests" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
              <Trophy size={16} className="mr-2" /> My Tests
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="quiz" className="space-y-4 animate-fade-in">
            <QuizSection />
          </TabsContent>
          
          <TabsContent value="mytests" className="space-y-4 animate-fade-in">
            <MyTestsSection onShare={handleShare} />
          </TabsContent>
        </Tabs>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="mt-8"
      >
        <Card className="border border-veno-primary/20 bg-gradient-to-br from-card/50 to-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <BarChart3 size={20} className="mr-2 text-veno-primary" />
                Performance Insights
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Track your educational progress and test performance over time.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="text-xs border-veno-primary/30 text-veno-primary"
                onClick={() => navigate('/cbt/analytics')}>
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CbtPage;
