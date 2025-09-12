import { ArrowLeft, BookOpen, FileCheck, Monitor, Trophy, Crown, Lock, Smartphone, Users, BarChart3, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdPlacement from "@/components/ads/AdPlacement";
import { playSound } from "@/utils/soundEffects";
import LoadingState from "@/components/cbt/test/LoadingState";
import { useState, useEffect } from "react";
import { BillingService } from "@/services/billingService";
import PaymentDialog from "@/components/billing/PaymentDialog";

const CbtPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [hasManualAccess, setHasManualAccess] = useState(false);
  const [hasAiAccess, setHasAiAccess] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<'manual_test' | 'ai_test'>('manual_test');
  
  useEffect(() => {
    const checkAccess = async () => {
      const [manual, ai] = await Promise.all([
        BillingService.hasFeatureAccess('manual_test'),
        BillingService.hasFeatureAccess('ai_test')
      ]);
      setHasManualAccess(manual);
      setHasAiAccess(ai);
      setIsLoading(false);
    };

    const timer = setTimeout(() => {
      checkAccess();
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleNavigation = (path: string) => {
    playSound('click', 0.3);
    navigate(path);
  };

  const handleCreateTest = () => {
    if (hasManualAccess) {
      handleNavigation('/cbt/create');
    } else {
      setSelectedFeature('manual_test');
      setShowPaymentDialog(true);
    }
  };

  const handleAiTest = () => {
    if (hasAiAccess) {
      handleNavigation('/cbt/ai-create');
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
      handleNavigation('/cbt/create');
    } else if (selectedFeature === 'ai_test') {
      handleNavigation('/cbt/ai-create');
    }
  };
  
  const starterPricing = BillingService.getFeaturePricing('manual_test');
  const proPricing = BillingService.getFeaturePricing('ai_test');
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

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
              onClick={() => handleNavigation('/')}
              className="h-9 w-9"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-r from-veno-primary to-veno-secondary rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="font-semibold text-lg">Veno CBT</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavigation('/pricing')}
              className="h-9 w-9"
            >
              <Crown size={18} />
            </Button>
          </div>
        </motion.div>
      )}

      <div className={`container mx-auto px-4 ${isMobile ? 'pb-24' : 'py-8'} max-w-4xl`}>
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
                  Veno CBT Platform
                </h1>
                <p className="text-muted-foreground mt-1">Computer Based Testing System</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigation('/')}
                className="h-10 w-10"
              >
                <ArrowLeft size={20} />
              </Button>
            </motion.div>
          )}

          {/* Hero Card */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-veno-primary/10 via-transparent to-veno-secondary/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                  <Smartphone size={24} />
                  Computer Based Testing
                </CardTitle>
                <p className="text-muted-foreground text-sm md:text-base">
                  Create unlimited tests with our subscription plans. Choose between manual creation or AI-powered generation.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    onClick={handleCreateTest}
                    className={`justify-start h-auto p-4 bg-gradient-to-r ${
                      hasManualAccess ? 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' : 'from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                    } hover:scale-[1.02] transition-all duration-200`}
                    size="lg"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-white/20 rounded-lg">
                        {hasManualAccess ? <Crown size={20} /> : <Lock size={20} />}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-white">
                          {hasManualAccess ? 'Create Manual Test' : `Starter Plan`}
                        </p>
                        <p className="text-xs text-white/80">
                          {hasManualAccess ? 'Full control over test creation' : `₦${(starterPricing.amount / 100).toLocaleString()}/month`}
                        </p>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    onClick={handleAiTest}
                    className={`justify-start h-auto p-4 bg-gradient-to-r ${
                      hasAiAccess ? 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : 'from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
                    } hover:scale-[1.02] transition-all duration-200`}
                    size="lg"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-white/20 rounded-lg">
                        {hasAiAccess ? <Crown size={20} /> : <Lock size={20} />}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-white">
                          {hasAiAccess ? 'AI Test Creation' : 'Pro Plan'}
                        </p>
                        <p className="text-xs text-white/80">
                          {hasAiAccess ? 'AI-powered test generation' : `₦${(proPricing.amount / 100).toLocaleString()}/month`}
                        </p>
                      </div>
                    </div>
                  </Button>
                </div>

                <Button
                  onClick={() => handleNavigation('/cbt/public-leaderboards')}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 border-2 hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 bg-veno-primary/10 rounded-lg">
                      <Trophy size={20} className="text-veno-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">Public Leaderboards</p>
                      <p className="text-xs text-muted-foreground">View top performers and compete</p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Access */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: FileCheck, label: "My Tests", path: "/cbt" },
                    { icon: Library, label: "Library", path: "/cbt/library" },
                    { icon: BarChart3, label: "Analytics", path: "/cbt/analytics" },
                    { icon: Users, label: "Teams", path: "/cbt/public-leaderboards" }
                  ].map((item) => (
                    <Button
                      key={item.label}
                      variant="ghost"
                      onClick={() => handleNavigation(item.path)}
                      className="h-auto py-4 flex-col gap-2 hover:scale-105 transition-all duration-200"
                    >
                      <div className="p-3 bg-veno-primary/10 rounded-lg">
                        <item.icon size={20} className="text-veno-primary" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Plans */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-muted/30 to-muted/10">
              <CardHeader>
                <CardTitle className="text-lg">Subscription Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900 dark:text-blue-100">Starter Plan</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Perfect for individual educators</p>
                    <p className="text-lg font-bold text-blue-600">₦{(starterPricing.amount / 100).toLocaleString()}/month</p>
                    <p className="text-xs text-muted-foreground">Unlimited manual tests</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-purple-900 dark:text-purple-100">Pro Plan</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Advanced AI-powered features</p>
                    <p className="text-lg font-bold text-purple-600">₦{(proPricing.amount / 100).toLocaleString()}/month</p>
                    <p className="text-xs text-muted-foreground">Unlimited AI tests + Manual tests</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleNavigation('/pricing')}
                  variant="outline"
                  className="w-full mt-4"
                >
                  View All Plans & Features
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ad Placement */}
          <motion.div variants={itemVariants}>
            <AdPlacement location="content" contentCheck={false} />
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
              { icon: Trophy, label: "Boards", path: "/cbt/public-leaderboards" }
            ].map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(item.path)}
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

export default CbtPage;
