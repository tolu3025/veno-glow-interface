
import React, { useEffect, useState } from 'react';

interface AdComponentProps {
  adSlot: string;
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
  contentCheck?: boolean; // New prop to verify content is available
}

const AdComponent: React.FC<AdComponentProps> = ({ 
  adSlot, 
  adFormat = 'auto', 
  className = '',
  contentCheck = true // Default to true, set to false when no content
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only initialize ads if contentCheck is true
    if (!contentCheck) {
      console.log('Ad not shown: No publisher content available');
      return;
    }

    // Set a delay to ensure content is loaded before showing ads
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      try {
        // Push commands to Google AdSense to refresh ads when component mounts
        // @ts-ignore - AdSense declarations not available in TypeScript
        if (window.adsbygoogle) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error('Error initializing AdSense:', error);
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [contentCheck]);

  // Don't render anything if content check fails
  if (!contentCheck || !isVisible) {
    return null;
  }

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
