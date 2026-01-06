import React, { createContext, useContext, useState, useEffect } from 'react';

interface PWAContextType {
  isPWA: boolean;
  isStandalone: boolean;
}

const PWAContext = createContext<PWAContextType>({
  isPWA: false,
  isStandalone: false,
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPWA, setIsPWA] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (PWA installed)
    const checkPWA = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      setIsPWA(isStandaloneMode);
    };

    checkPWA();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      setIsPWA(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <PWAContext.Provider value={{ isPWA, isStandalone }}>
      {children}
    </PWAContext.Provider>
  );
};
