import { useEffect, useState } from "react";

const STORAGE_KEY = "kukapay_splash_seen_v1";

const SplashScreen = () => {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
        const fadeTimer = setTimeout(() => setFadeOut(true), 2600);
        const hideTimer = setTimeout(() => {
          setVisible(false);
          localStorage.setItem(STORAGE_KEY, "1");
        }, 3200);
        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(hideTimer);
        };
      }
    } catch {
      // ignore
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between px-8 py-12 bg-gradient-to-br from-[#0a0a2e] via-[#1a1456] to-[#6C5CE7] transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Top brand */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-white/20 rounded-full animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center">
            <img
              src="/kukapay-icon.png"
              alt="KukaPay"
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>
        <h1 className="mt-6 text-4xl font-extrabold text-white tracking-tight animate-fade-in">
          KukaPay
        </h1>
        <p className="mt-2 text-white/70 text-sm font-medium tracking-wide animate-fade-in">
          Campus wallet. Zero fees.
        </p>
      </div>

      {/* Footer */}
      <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
        <div className="w-full flex flex-col items-center pt-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Powered by
          </span>
          <span className="mt-1 text-xs font-semibold text-white/80 tracking-wide text-center">
            KUKA TECHNOLOGY AND INNOVATION LTD
          </span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
