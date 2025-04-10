
import React from 'react';
import AdComponent from './AdComponent';

interface AdPlacementProps {
  location: 'header' | 'sidebar' | 'footer' | 'content' | 'article';
  contentAvailable?: boolean; // New prop to indicate if there's actual content
}

const AdPlacement: React.FC<AdPlacementProps> = ({ 
  location,
  contentAvailable = true // Default to true, should be set to false when no content 
}) => {
  // Different ad formats based on placement location
  const getAdConfig = () => {
    switch (location) {
      case 'header':
        return {
          adSlot: '1234567890', // Replace with your actual ad slot ID
          adFormat: 'horizontal' as const,
          className: 'w-full h-auto'
        };
      case 'sidebar':
        return {
          adSlot: '2345678901', // Replace with your actual ad slot ID
          adFormat: 'vertical' as const,
          className: 'h-full'
        };
      case 'footer':
        return {
          adSlot: '3456789012', // Replace with your actual ad slot ID
          adFormat: 'horizontal' as const,
          className: 'w-full'
        };
      case 'content':
        return {
          adSlot: '4567890123', // Replace with your actual ad slot ID
          adFormat: 'rectangle' as const,
          className: 'mx-auto max-w-md'
        };
      case 'article':
        return {
          adSlot: '5678901234', // Replace with your actual ad slot ID
          adFormat: 'auto' as const,
          className: 'my-6'
        };
      default:
        return {
          adSlot: '6789012345', // Replace with your actual ad slot ID
          adFormat: 'auto' as const,
          className: ''
        };
    }
  };

  const config = getAdConfig();
  
  return (
    <div className={`ad-placement ad-placement-${location}`}>
      <AdComponent
        adSlot={config.adSlot}
        adFormat={config.adFormat}
        className={config.className}
        contentCheck={contentAvailable}
      />
    </div>
  );
};

export default AdPlacement;
