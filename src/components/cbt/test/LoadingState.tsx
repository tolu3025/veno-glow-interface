
import React from 'react';
import { VenoLogo } from '@/components/ui/logo';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-xl mx-auto">
      <div className="animate-bounce">
        <VenoLogo className="h-12 w-12" />
      </div>
    </div>
  );
};

export default LoadingState;
