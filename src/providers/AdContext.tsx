
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdContextType {
  adsEnabled: boolean;
  toggleAds: (enabled: boolean) => void;
  pageHasContent: boolean;
  setPageHasContent: (hasContent: boolean) => void;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export function AdProvider({ children }: { children: ReactNode }) {
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [pageHasContent, setPageHasContent] = useState(false);

  const toggleAds = (enabled: boolean) => {
    setAdsEnabled(enabled);
  };

  return (
    <AdContext.Provider value={{ 
      adsEnabled, 
      toggleAds, 
      pageHasContent, 
      setPageHasContent 
    }}>
      {children}
    </AdContext.Provider>
  );
}

export function useAds() {
  const context = useContext(AdContext);
  if (context === undefined) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
}
