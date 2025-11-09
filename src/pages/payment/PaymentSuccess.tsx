import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timeout = setTimeout(() => {
      navigate('/cbt');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="flex justify-center">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your subscription has been activated successfully. You now have unlimited access to your chosen plan.
          </p>
        </div>
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/cbt')}
            className="w-full"
          >
            Start Creating Tests
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/pricing')}
            className="w-full"
          >
            View Subscription Details
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Redirecting automatically in 5 seconds...
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
