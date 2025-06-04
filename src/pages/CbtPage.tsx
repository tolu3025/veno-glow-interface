import { ArrowLeft, BookOpen, FileCheck, Monitor, Trophy, Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  
  const cbtModules = [
    {
      title: "Introduction to Programming",
      description: "Learn the basics of programming concepts and logic. Our comprehensive module covers fundamental programming principles, problem-solving approaches, and introductory algorithm design.",
      icon: Monitor,
      progress: 75,
    },
    {
      title: "Web Development Fundamentals",
      description: "HTML, CSS and JavaScript basics for web development. This course provides hands-on experience building responsive web pages and interactive user interfaces.",
      icon: BookOpen,
      progress: 45,
    },
    {
      title: "Data Structures",
      description: "Understanding key data structures and algorithms. Master essential concepts like arrays, linked lists, trees, and graphs while learning how to analyze algorithmic efficiency.",
      icon: FileCheck,
      progress: 20,
    },
  ];

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
    // Refresh access status
    const [manual, ai] = await Promise.all([
      BillingService.hasFeatureAccess('manual_test'),
      BillingService.hasFeatureAccess('ai_test')
    ]);
    setHasManualAccess(manual);
    setHasAiAccess(ai);

    // Navigate to appropriate page
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
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => handleNavigation('/')}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary mr-3"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">Veno CBT</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2 border-l-4 border-l-veno-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Computer Based Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-5">
              Create tests, manage questions, and track performance with our comprehensive CBT platform.
              Choose between manual test creation with full control or AI-powered generation for quick setup.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Button 
                onClick={handleCreateTest}
                className={`w-full md:max-w-xs ${hasManualAccess ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'}`}
                size={isMobile ? "sm" : "default"}
              >
                {hasManualAccess ? (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    Create Manual Test
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Starter Plan (₦{(starterPricing.amount / 100).toLocaleString()})
                  </>
                )}
              </Button>

              <Button 
                onClick={handleAiTest}
                className={`w-full md:max-w-xs ${hasAiAccess ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'}`}
                size={isMobile ? "sm" : "default"}
              >
                {hasAiAccess ? (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    AI Test Creation
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Pro Plan (₦{(proPricing.amount / 100).toLocaleString()})
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleNavigation('/cbt/public-leaderboards')}
                variant="secondary"
                size={isMobile ? "sm" : "default"}
                className="w-full md:max-w-xs flex items-center gap-2 justify-center"
              >
                <Trophy size={16} />
                Leaderboards
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-veno-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pricing Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="font-medium text-sm">Starter Plan</div>
                <div className="text-xs text-muted-foreground">₦{(starterPricing.amount / 100).toLocaleString()} • {starterPricing.accessCount} manual tests</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <div className="font-medium text-sm">Pro Plan</div>
                <div className="text-xs text-muted-foreground">₦{(proPricing.amount / 100).toLocaleString()} • {proPricing.accessCount} AI tests</div>
              </div>
              <Button
                onClick={() => handleNavigation('/pricing')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                View All Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-lg font-medium mb-4">Your Learning Path</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Continue your personalized learning journey with these recommended modules.
        Each module is designed to build on previous knowledge and enhance your understanding
        of key concepts in computer science and programming.
      </p>
      
      <div className="space-y-4 mb-8">
        {cbtModules.map((module, index) => (
          <motion.div 
            key={module.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="veno-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleNavigation('/cbt/')}
            role="button"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 max-w-[70%]">
                <div className="rounded-lg bg-veno-primary/10 p-2 text-veno-primary shrink-0">
                  <module.icon size={18} />
                </div>
                <h3 className="font-medium text-sm truncate">{module.title}</h3>
              </div>
              <span className="text-sm font-medium text-veno-primary shrink-0">{module.progress}%</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{module.description}</p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-veno-primary h-2 rounded-full" 
                style={{ width: `${module.progress}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="bg-muted/30 p-5 rounded-lg mb-8">
        <h3 className="text-lg font-medium mb-3">Learning Resources</h3>
        <p className="text-sm mb-4">
          Enhance your understanding with these additional learning materials and resources.
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Interactive programming tutorials with step-by-step guidance</li>
          <li>Comprehensive video lectures from industry professionals</li>
          <li>Practice exercises to reinforce theoretical concepts</li>
          <li>Community forums for peer learning and problem-solving</li>
          <li>Expert feedback on programming assignments and projects</li>
        </ul>
      </div>
      
      <div className="my-6">
        <AdPlacement location="content" contentCheck={false} />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <Button 
          className="w-full bg-veno-primary hover:bg-veno-primary/90"
          onClick={() => handleNavigation('/cbt')}
        >
          Explore Courses
        </Button>
        <Button 
          variant="outline"
          className="w-full"
          onClick={() => handleNavigation('/services')}
        >
          View All Services
        </Button>
      </div>

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
