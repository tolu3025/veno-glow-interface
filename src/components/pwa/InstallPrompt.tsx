import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone, Zap, Wifi, Share, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PROMPT_DISMISSED_KEY = 'pwa-prompt-dismissed';
const PROMPT_DISMISSED_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const PROMPT_NEVER_SHOW_KEY = 'pwa-prompt-never-show';
const PROMPT_NEVER_SHOW_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Detect platform
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isAndroid = () => /Android/.test(navigator.userAgent);
const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isChrome = () => /Chrome/.test(navigator.userAgent) && !/Edge|Edg/.test(navigator.userAgent);
const isInStandaloneMode = () => 
  window.matchMedia('(display-mode: standalone)').matches || 
  (window.navigator as any).standalone === true;

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect platform
    if (isIOS()) {
      setPlatform('ios');
    } else if (isAndroid()) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if already installed
    if (isInStandaloneMode()) {
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

    // For iOS in Safari, show manual instructions after delay
    if (isIOS() && isSafari()) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // For Android/Chrome, listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      console.log('beforeinstallprompt event fired');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also show prompt for Android Chrome even without event (fallback)
    if (isAndroid() && isChrome()) {
      const fallbackTimer = setTimeout(() => {
        if (!deferredPrompt) {
          console.log('Showing Android install prompt (fallback)');
          setShowPrompt(true);
        }
      }, 5000);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        clearTimeout(fallbackTimer);
      };
    }

    window.addEventListener('appinstalled', () => {
      console.log('App installed');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    // For Android with deferred prompt - install directly
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install prompt outcome:', outcome);
        
        if (outcome === 'accepted') {
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install prompt error:', error);
      }
      return;
    }

    // For iOS, show instructions
    if (platform === 'ios') {
      setShowInstructions(true);
    }
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
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                  <img src="/veno-logo.png" alt="Veno" className="h-8 w-8 object-contain" />
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
            {showInstructions ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  To install Veno on your {platform === 'ios' ? 'iPhone/iPad' : 'Android device'}:
                </p>
                {platform === 'ios' ? (
                  <ol className="text-sm space-y-2 list-decimal list-inside">
                    <li className="flex items-center gap-2">
                      <span>Tap the</span>
                      <Share className="h-4 w-4 inline text-primary" />
                      <span>Share button in Safari</span>
                    </li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right corner</li>
                  </ol>
                ) : (
                  <ol className="text-sm space-y-2 list-decimal list-inside">
                    <li className="flex items-center gap-2">
                      <span>Tap the</span>
                      <span className="text-primary font-bold">⋮</span>
                      <span>menu in Chrome</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span>Tap "Add to Home screen" or</span>
                      <Plus className="h-4 w-4 inline text-primary" />
                    </li>
                    <li>Tap "Add" to confirm</li>
                  </ol>
                )}
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => setShowInstructions(false)}
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
                    {platform === 'android' && deferredPrompt ? 'Install Now' : platform === 'ios' ? 'How to Install' : 'Install App'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={handleNeverShow}
                  >
                    Not now
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
