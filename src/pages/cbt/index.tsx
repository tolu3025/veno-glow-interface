
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  Trophy, 
  BookOpen, 
  BarChart3, 
  Users, 
  Clock,
  Smartphone,
  ArrowLeft,
  Crown,
  Zap,
  Target,
  TrendingUp,
  Library
} from 'lucide-react';
import QuizSection from '@/components/cbt/QuizSection';
import MyTestsSection from '@/components/cbt/MyTestsSection';
import { BillingService } from '@/services/billingService';
import PaymentDialog from '@/components/billing/PaymentDialog';

const CBTIndex = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [hasManualAccess, setHasManualAccess] = useState(false);
  const [hasAiAccess, setHasAiAccess] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<'manual_test' | 'ai_test'>('manual_test');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch user tests
        const { data: testsData, error: testsError } = await supabase
          .from('user_tests')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (testsError) throw testsError;
        setTests(testsData || []);

        // Check feature access
        const [manual, ai] = await Promise.all([
          BillingService.hasFeatureAccess('manual_test'),
          BillingService.hasFeatureAccess('ai_test')
        ]);
        setHasManualAccess(manual);
        setHasAiAccess(ai);
      } catch (error: any) {
        toast.error(`Failed to fetch data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleShare = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      navigator.clipboard.writeText(test.share_code)
        .then(() => toast.success(`Share code '${test.share_code}' copied to clipboard!`))
        .catch(() => toast.error("Failed to copy share code"));
    }
  };

  const handleCreateTest = () => {
    if (hasManualAccess) {
      navigate('/cbt/create');
    } else {
      setSelectedFeature('manual_test');
      setShowPaymentDialog(true);
    }
  };

  const handleAiTest = () => {
    if (hasAiAccess) {
      navigate('/cbt/ai-create');
    } else {
      setSelectedFeature('ai_test');
      setShowPaymentDialog(true);
    }
  };

  const handlePaymentComplete = async () => {
    const [manual, ai] = await Promise.all([
      BillingService.hasFeatureAccess('manual_test'),
      BillingService.hasFeatureAccess('ai_test')
    ]);
    setHasManualAccess(manual);
    setHasAiAccess(ai);

    if (selectedFeature === 'manual_test') {
      navigate('/cbt/create');
    } else if (selectedFeature === 'ai_test') {
      navigate('/cbt/ai-create');
    }
  };

  const quickActions = [
    {
      title: "Create Manual Test",
      description: "Build custom tests with full control",
      icon: PlusCircle,
      action: handleCreateTest,
      hasAccess: hasManualAccess,
      gradient: "from-blue-500 to-cyan-500",
      lockGradient: "from-yellow-500 to-orange-500"
    },
    {
      title: "AI Test Creation",
      description: "Generate tests using AI technology",
      icon: Zap,
      action: handleAiTest,
      hasAccess: hasAiAccess,
      gradient: "from-purple-500 to-pink-500",
      lockGradient: "from-gray-400 to-gray-500"
    }
  ];

  const statsCards = [
    {
      title: "Total Tests",
      value: tests.length,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      title: "This Month",
      value: tests.filter(test => new Date(test.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    },
    {
      title: "Avg Questions",
      value: tests.length > 0 ? Math.round(tests.reduce((acc, test) => acc + (test.question_count || 0), 0) / tests.length) : 0,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Mobile Header */}
      {isMobile && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-9 w-9"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-r from-veno-primary to-veno-secondary rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="font-semibold text-lg">CBT Platform</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/cbt/analytics')}
              className="h-9 w-9"
            >
              <BarChart3 size={18} />
            </Button>
          </div>
        </motion.div>
      )}

      <div className={`container mx-auto px-4 ${isMobile ? 'pb-24' : 'py-8'} max-w-6xl`}>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Desktop Header */}
          {!isMobile && (
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-veno-primary to-veno-secondary bg-clip-text text-transparent">
                  CBT Platform
                </h1>
                <p className="text-muted-foreground mt-1">Create, manage, and analyze your computer-based tests</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="h-10 w-10"
              >
                <ArrowLeft size={20} />
              </Button>
            </motion.div>
          )}

          {/* Stats Cards */}
          {user && (
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 md:gap-4">
              {statsCards.map((stat, index) => (
                <Card key={stat.title} className="relative overflow-hidden">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground font-medium">{stat.title}</p>
                        <p className="text-lg md:text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-2 md:p-3 rounded-full ${stat.bgColor}`}>
                        <stat.icon size={isMobile ? 16 : 20} className={stat.color} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-veno-primary/5 via-transparent to-veno-secondary/5">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Smartphone size={20} />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      onClick={action.action}
                      className={`w-full justify-start h-auto p-4 bg-gradient-to-r ${
                        action.hasAccess ? action.gradient : action.lockGradient
                      } hover:scale-[1.02] transition-all duration-200`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 bg-white/20 rounded-lg">
                          {action.hasAccess ? (
                            <action.icon size={20} />
                          ) : (
                            <Crown size={20} />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-white">{action.title}</p>
                          <p className="text-xs text-white/80">{action.description}</p>
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}

                <Button
                  onClick={() => navigate('/cbt/public-leaderboards')}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 border-2 hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 bg-veno-primary/10 rounded-lg">
                      <Trophy size={20} className="text-veno-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">Public Leaderboards</p>
                      <p className="text-xs text-muted-foreground">View top performers</p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Test Section */}
          <motion.div variants={itemVariants}>
            <QuizSection />
          </motion.div>

          {/* My Tests Section */}
          <motion.div variants={itemVariants}>
            <MyTestsSection tests={tests} loading={loading} onShare={handleShare} />
          </motion.div>
        </motion.div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t"
        >
          <div className="flex items-center justify-around py-2 px-4">
            {[
              { icon: BookOpen, label: "Tests", path: "/cbt" },
              { icon: Library, label: "Library", path: "/cbt/library" },
              { icon: BarChart3, label: "Analytics", path: "/cbt/analytics" },
              { icon: Users, label: "Teams", path: "/cbt/public-leaderboards" }
            ].map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className="flex-1 flex flex-col items-center gap-1 h-auto py-2 px-2"
              >
                <item.icon size={18} />
                <span className="text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      <PaymentDialog
        isOpen={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        featureType={selectedFeature}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default CBTIndex;
