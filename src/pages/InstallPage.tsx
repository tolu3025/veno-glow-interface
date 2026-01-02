import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Zap, Wifi, Shield, CheckCircle2, Share, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, title: 'Lightning Fast', description: 'Instant loading with offline support' },
    { icon: Smartphone, title: 'Native Experience', description: 'Feels like a real mobile app' },
    { icon: Wifi, title: 'Works Offline', description: 'Access content without internet' },
    { icon: Shield, title: 'Secure', description: 'Your data stays safe and private' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="container max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="h-24 w-24 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center shadow-lg">
            <img src="/veno-logo.png" alt="Veno" className="h-16 w-16" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Install Veno</h1>
          <p className="text-muted-foreground text-lg">
            Get the full app experience on your device
          </p>
        </motion.div>

        {isInstalled ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Already Installed!</h2>
                <p className="text-muted-foreground">
                  Veno is already installed on your device. Open it from your home screen!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="grid gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-border/50">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {deferredPrompt ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button 
                  onClick={handleInstall} 
                  size="lg" 
                  className="w-full gap-2 text-lg py-6"
                >
                  <Download className="h-5 w-5" />
                  Install Veno Now
                </Button>
              </motion.div>
            ) : isIOS ? (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Install on iOS</CardTitle>
                  <CardDescription>Follow these steps to install Veno</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      1
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Tap the</span>
                      <Share className="h-5 w-5 text-primary" />
                      <span className="font-medium">Share</span>
                      <span>button in Safari</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      2
                    </div>
                    <div>
                      <span>Scroll down and tap </span>
                      <span className="font-medium">"Add to Home Screen"</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      3
                    </div>
                    <div>
                      <span>Tap </span>
                      <span className="font-medium">"Add"</span>
                      <span> to confirm</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Install on Android</CardTitle>
                  <CardDescription>Follow these steps to install Veno</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      1
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Tap the</span>
                      <MoreVertical className="h-5 w-5 text-primary" />
                      <span className="font-medium">menu</span>
                      <span>in Chrome</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      2
                    </div>
                    <div>
                      <span>Tap </span>
                      <span className="font-medium">"Install app"</span>
                      <span> or </span>
                      <span className="font-medium">"Add to Home screen"</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      3
                    </div>
                    <div>
                      <span>Tap </span>
                      <span className="font-medium">"Install"</span>
                      <span> to confirm</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InstallPage;
