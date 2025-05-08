
import React, { useEffect, useState } from 'react';

interface AdComponentProps {
  adSlot: string;
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
  contentCheck?: boolean; // Prop to check if there's enough content
}

const AdComponent: React.FC<AdComponentProps> = ({ 
  adSlot, 
  adFormat = 'auto', 
  className = '',
  contentCheck = true // Default to true to maintain backward compatibility
}) => {
  const [shouldRenderAd, setShouldRenderAd] = useState(false);
  
  useEffect(() => {
    // Check if the page has enough content before displaying ads
    const verifyContent = () => {
      if (!contentCheck) {
        // Skip content verification if explicitly disabled
        setShouldRenderAd(true);
        return;
      }
      
      // Get the main content element
      const mainContent = document.querySelector('main') || document.body;
      
      if (!mainContent) {
        setShouldRenderAd(false);
        return;
      }
      
      // Calculate the content height (excluding ads and empty elements)
      const contentHeight = mainContent.scrollHeight;
      const contentText = mainContent.textContent || '';
      const wordCount = contentText.split(/\s+/).filter(word => word.length > 0).length;
      
      // Further reduced thresholds to allow more ads to display
      // Only show ads if there's substantial content (at least 100px height and 50 words)
      const hasSubstantialContent = contentHeight > 100 && wordCount > 50;
      setShouldRenderAd(hasSubstantialContent);

      // Log content metrics for debugging
      console.log('Content metrics:', {
        contentHeight,
        wordCount,
        hasSubstantialContent,
        adSlot
      });
    };
    
    // Run content verification after a short delay to ensure content is rendered
    const timer = setTimeout(verifyContent, 1000);
    return () => clearTimeout(timer);
  }, [contentCheck, adSlot]);
  
  useEffect(() => {
    // Push commands to Google AdSense to refresh ads when component mounts and should display
    if (shouldRenderAd) {
      try {
        // @ts-ignore - AdSense declarations not available in TypeScript
        if (window.adsbygoogle) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error('Error initializing AdSense:', error);
      }
    }
  }, [shouldRenderAd]);

  // Don't render anything if content check fails
  if (!shouldRenderAd) {
    console.log(`Ad with slot ${adSlot} not rendered due to insufficient content`);
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
