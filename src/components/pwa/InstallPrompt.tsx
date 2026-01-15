import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone, Zap, Wifi, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PROMPT_DISMISSED_KEY = 'pwa-prompt-dismissed';
const PROMPT_DISMISSED_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const PROMPT_NEVER_SHOW_KEY = 'pwa-prompt-never-show';
const PROMPT_NEVER_SHOW_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS and running in Safari
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    if (isInStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < PROMPT_DISMISSED_DURATION) {
        return;
      }
    }

    // Check if "never show" is set
    const neverShowAt = localStorage.getItem(PROMPT_NEVER_SHOW_KEY);
    if (neverShowAt) {
      const neverShowTime = parseInt(neverShowAt, 10);
      if (Date.now() - neverShowTime < PROMPT_NEVER_SHOW_DURATION) {
        return;
      }
    }

    // For iOS, show prompt after delay
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 3000);
      return;
    }

    // For other browsers, listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
  };

  const handleNeverShow = () => {
    setShowPrompt(false);
    localStorage.setItem(PROMPT_NEVER_SHOW_KEY, Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <Card className="border-primary/20 bg-card/95 backdrop-blur-lg shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <img src="/veno-logo.png" alt="Veno" className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-lg">Install Veno</CardTitle>
                  <CardDescription className="text-xs">Add to your home screen</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 -mr-2"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {showIOSInstructions ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  To install Veno on your {isIOS ? 'iPhone/iPad' : 'device'}:
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li className="flex items-center gap-2">
                    <span>Tap the</span>
                    <Share className="h-4 w-4 inline" />
                    <span>Share button</span>
                  </li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right corner</li>
                </ol>
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => setShowIOSInstructions(false)}
                >
                  Got it
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" />
                    Fast access
                  </span>
                  <span className="flex items-center gap-1">
                    <Wifi className="h-3 w-3 text-primary" />
                    Works offline
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="h-3 w-3 text-primary" />
                    Native feel
                  </span>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={handleInstall} 
                    className="w-full gap-2"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    Install App
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={handleNeverShow}
                  >
                    Don't show again for a week
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
