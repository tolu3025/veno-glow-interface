
import React from 'react';
import { VenoLogo } from '@/components/ui/logo';

const LoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="animate-pulse">
        <VenoLogo className="h-16 w-16" />
      </div>
    </div>
  );
};

export default LoadingState;
