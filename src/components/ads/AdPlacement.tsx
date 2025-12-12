import React from 'react';

interface AdPlacementProps {
  location: 'header' | 'sidebar' | 'footer' | 'content' | 'article' | 'article-middle';
  contentCheck?: boolean;
}

// AdSense removed - component returns null to remove ad spaces
const AdPlacement: React.FC<AdPlacementProps> = () => {
  return null;
};

export default AdPlacement;
