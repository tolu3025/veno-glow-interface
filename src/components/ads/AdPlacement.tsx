
import React from 'react';
import AdComponent from './AdComponent';

interface AdPlacementProps {
  location: 'header' | 'sidebar' | 'footer' | 'content' | 'article' | 'article-middle';
  contentCheck?: boolean;
}

const AdPlacement: React.FC<AdPlacementProps> = ({
  location,
  contentCheck = true
}) => {
  // Different ad formats based on placement location
  const getAdConfig = () => {
    switch (location) {
      case 'header':
        return {
          adSlot: '1234567890',
          adFormat: 'horizontal' as const,
          className: 'w-full h-auto my-6'
        };
      case 'sidebar':
        return {
          adSlot: '2345678901',
          adFormat: 'vertical' as const,
          className: 'h-full w-[300px] my-4'
        };
      case 'footer':
        return {
          adSlot: '3456789012',
          adFormat: 'horizontal' as const,
          className: 'w-full py-4 min-h-[90px]'
        };
      case 'content':
        return {
          adSlot: '4567890123',
          adFormat: 'rectangle' as const,
          className: 'mx-auto max-w-[336px] my-8'
        };
      case 'article':
        return {
          adSlot: '5678901234',
          adFormat: 'auto' as const,
          className: 'my-6'
        };
      case 'article-middle':
        return {
          adSlot: '5678901234',
          adFormat: 'rectangle' as const,
          className: 'my-8 mx-auto max-w-[336px] min-h-[280px]'
        };
      default:
        return {
          adSlot: '6789012345',
          adFormat: 'auto' as const,
          className: ''
        };
    }
  };

  const config = getAdConfig();
  
  return (
    <AdComponent
      adSlot={config.adSlot}
      adFormat={config.adFormat}
      className={config.className}
      contentCheck={contentCheck}
    />
  );
};

export default AdPlacement;
