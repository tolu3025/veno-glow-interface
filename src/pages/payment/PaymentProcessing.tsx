import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentProcessing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to pricing page after 10 seconds if still on this page
    const timeout = setTimeout(() => {
      navigate('/pricing');
    }, 10000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Processing Payment</h1>
          <p className="text-muted-foreground max-w-md">
            Please wait while we process your payment. Do not close this window.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          This may take a few moments...
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;
