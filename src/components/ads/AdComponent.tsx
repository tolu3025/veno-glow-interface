
import React, { useEffect } from 'react';

interface AdComponentProps {
  adSlot: string;
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

const AdComponent: React.FC<AdComponentProps> = ({ 
  adSlot, 
  adFormat = 'auto', 
  className = '' 
}) => {
  useEffect(() => {
    // Push commands to Google AdSense to refresh ads when component mounts
    try {
      // @ts-ignore - AdSense declarations not available in TypeScript
      if (window.adsbygoogle) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('Error initializing AdSense:', error);
    }
  }, []);

  return (
    <div className={`ad-container my-4 overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-7351273522350059"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdComponent;
