
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-xl mx-auto">
      <Loader2 className="h-8 w-8 animate-spin text-veno-primary mb-4" />
      <p className="text-muted-foreground">Loading questions...</p>
    </div>
  );
};

export default LoadingState;
