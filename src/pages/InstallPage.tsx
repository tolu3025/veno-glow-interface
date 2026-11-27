import { useState, useEffect } from "react";
import { ArrowLeft, Download, Share, MoreVertical, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="px-5 pt-10 pb-24 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Install Kuka Pay</h1>
      </div>

      {isInstalled ? (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <p className="font-semibold text-lg">Already Installed! ✅</p>
            <p className="text-sm text-muted-foreground">
              Kuka Pay is already on your home screen. Open it from there for the best experience.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Hero */}
          <Card className="overflow-hidden">
            <CardContent className="p-6 text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl mx-auto overflow-hidden shadow-lg">
                <img src="/icons/icon-512.png" alt="Kuka Pay" className="h-full w-full object-cover" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Get the App Experience</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Install Kuka Pay on your phone for instant access, offline support, and a native app feel — no app store needed.
                </p>
              </div>

              {deferredPrompt && (
                <Button className="w-full gap-2" size="lg" onClick={handleInstall}>
                  <Download className="h-4 w-4" /> Install Kuka Pay
                </Button>
              )}
            </CardContent>
          </Card>

          {/* iOS Instructions */}
          {isIOS && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold">Install on iPhone / iPad</h3>
                <div className="space-y-3">
                  <Step number={1} icon={<Share className="h-4 w-4" />}>
                    Tap the <strong>Share</strong> button at the bottom of Safari
                  </Step>
                  <Step number={2} icon={<Plus className="h-4 w-4" />}>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </Step>
                  <Step number={3} icon={<Download className="h-4 w-4" />}>
                    Tap <strong>"Add"</strong> to confirm
                  </Step>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Make sure you're using <strong>Safari</strong> — this doesn't work in Chrome or other browsers on iOS.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Android Instructions */}
          {!isIOS && !deferredPrompt && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold">Install on Android</h3>
                <div className="space-y-3">
                  <Step number={1} icon={<MoreVertical className="h-4 w-4" />}>
                    Tap the <strong>menu (⋮)</strong> in the top-right of Chrome
                  </Step>
                  <Step number={2} icon={<Download className="h-4 w-4" />}>
                    Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>
                  </Step>
                  <Step number={3} icon={<Smartphone className="h-4 w-4" />}>
                    Tap <strong>"Install"</strong> to confirm
                  </Step>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold">Why Install?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">⚡ <span>Loads instantly — no browser loading time</span></li>
                <li className="flex gap-2">📱 <span>Full-screen app experience</span></li>
                <li className="flex gap-2">📡 <span>Works offline — queued transactions sync when back online</span></li>
                <li className="flex gap-2">🔔 <span>Push notifications for payments</span></li>
                <li className="flex gap-2">🏠 <span>Quick access from your home screen</span></li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

const Step = ({ number, icon, children }: { number: number; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
      {number}
    </div>
    <p className="text-sm pt-0.5">{children}</p>
  </div>
);

export default InstallPage;
