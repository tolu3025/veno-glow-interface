
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, PlusCircle, BarChart, WifiOff, BookOpen, Library, Flame, Coins, Mic, Crown, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CoinService } from "@/services/coinService";
import { BillingService } from "@/services/billingService";
import { CoinHistoryModal } from "@/components/coins/CoinHistoryModal";

const AppNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [coinBalance, setCoinBalance] = useState(0);
  const [showCoinHistory, setShowCoinHistory] = useState(false);
  const [hasVoiceTutorAccess, setHasVoiceTutorAccess] = useState(false);

  // Fetch coin balance
  useEffect(() => {
    if (user) {
      CoinService.getCoinBalance().then(setCoinBalance);
      BillingService.hasFeatureAccess('voice_tutor').then(setHasVoiceTutorAccess);
    }
  }, [user]);
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    {
      name: "Dashboard",
      path: "/cbt",
      icon: <Home size={18} />,
      authRequired: true
    },
    {
      name: "Create Test",
      path: "/cbt/create",
      icon: <PlusCircle size={18} />,
      authRequired: true
    },
    {
      name: "Quiz Analytics",
      path: "/cbt/analytics",
      icon: <BarChart size={18} />,
      authRequired: true,
      highlight: true
    },
    {
      name: "Library",
      path: "/cbt/library",
      icon: <Library size={18} />,
      authRequired: true,
    },
    {
      name: "Streak Challenge",
      path: "/cbt/streak-challenge",
      icon: <Flame size={18} />,
      authRequired: true,
      highlight: true,
    },
    {
      name: "Voice Tutor",
      path: "/voice-tutor",
      icon: <Mic size={18} />,
      authRequired: true,
      isPremium: !hasVoiceTutorAccess,
    },
    {
      name: "Course Material",
      path: "/cbt/course-material-test",
      icon: <FileText size={18} />,
      authRequired: true,
    },
    {
      name: "Quiz",
      path: "/cbt?tab=quiz",
      icon: <BookOpen size={18} />,
      authRequired: true
    }
  ];

  const handleNavigation = (path: string, authRequired: boolean) => {
    if (authRequired && !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this feature",
        variant: "warning",
      });
      navigate('/auth');
      return;
    }
    
    if (isOffline && path !== '/cbt?tab=quiz') {
      toast({
        title: "Limited Functionality",
        description: "Some features may not work while offline",
        variant: "warning",
      });
    }
    
    navigate(path);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-full border-r bg-background/95 backdrop-blur md:w-64">
      {isOffline && (
        <div className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 py-2 px-4 text-xs flex items-center">
          <WifiOff size={14} className="mr-2" />
          <span>You're offline</span>
        </div>
      )}
      <div className="hidden md:flex flex-col justify-between h-full">
        <nav className="flex flex-col px-4 py-6">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant={(item as any).highlight ? "default" : "ghost"}
              className={`justify-start mb-1 ${
                location.pathname === item.path 
                  ? 'font-bold bg-primary/10 text-primary hover:bg-primary/20' 
                  : (item as any).highlight 
                    ? 'bg-veno-primary hover:bg-veno-primary/90 text-white' 
                    : ''
              }`}
              onClick={() => handleNavigation(item.path, item.authRequired)}
              disabled={item.authRequired && !user}
            >
              {item.icon}
              <span className="ml-2 flex-1 text-left">{item.name}</span>
              {(item as any).isPremium && (
                <Crown className="w-3 h-3 text-amber-500" />
              )}
            </Button>
          ))}
        </nav>
        
        {/* Coin Balance */}
        {user && (
          <div className="px-4 py-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400"
              onClick={() => setShowCoinHistory(true)}
            >
              <Coins className="w-4 h-4" />
              <span className="font-semibold">{coinBalance} Coins</span>
            </Button>
          </div>
        )}
        
        <div className="px-4 py-6">
          {user ? (
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          )}
        </div>
      </div>
      
      <CoinHistoryModal open={showCoinHistory} onOpenChange={setShowCoinHistory} />
    </aside>
  );
};

export default AppNavigation;
