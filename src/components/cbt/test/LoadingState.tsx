
import React from 'react';
import { VenoLogo } from '@/components/ui/logo';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-xl mx-auto">
      <div className="animate-bounce mb-4">
        <VenoLogo className="h-12 w-12" />
      </div>
      <p className="text-xs text-muted-foreground mt-2">Loading...</p>
    </div>
  );
};

export default LoadingState;
