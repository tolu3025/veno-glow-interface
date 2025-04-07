
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const LoadingState: React.FC = () => {
  const [loadingTime, setLoadingTime] = useState(0);
  const navigate = useNavigate();
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-veno-primary mb-4" />
      <p className="text-muted-foreground mb-2">Loading test content...</p>
      <p className="text-sm text-muted-foreground mb-4">({loadingTime}s)</p>
      
      {loadingTime > 10 && (
        <div className="mt-4 flex flex-col items-center">
          <p className="text-sm text-amber-500 mb-4">
            {loadingTime > 20 ? 
              "This is taking longer than expected. There may be a connection issue." : 
              "Loading is taking a bit longer than usual. Please wait..."}
          </p>
          {loadingTime > 15 && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/cbt')}
              className="px-4"
            >
              Return to Tests
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingState;
