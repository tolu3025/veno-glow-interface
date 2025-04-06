
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
      <p className="text-muted-foreground mb-2">Loading questions...</p>
      <p className="text-sm text-muted-foreground mb-4">({loadingTime}s)</p>
      
      {loadingTime > 15 && (
        <div className="mt-4 flex flex-col items-center">
          <p className="text-sm text-amber-500 mb-4">
            Loading is taking longer than expected. You can wait or return to the tests page.
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/cbt')}
            className="px-4"
          >
            Return to Tests
          </Button>
        </div>
      )}
    </div>
  );
};

export default LoadingState;
