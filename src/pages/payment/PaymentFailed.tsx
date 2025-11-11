import React from 'react';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <div className="flex justify-center">
          <XCircle className="h-20 w-20 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Payment Failed</h1>
          <p className="text-muted-foreground">
            We couldn't process your payment. This could be due to insufficient funds, network issues, or the payment was cancelled.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">Common reasons for payment failure:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Insufficient account balance</li>
                  <li>Network connectivity issues</li>
                  <li>Payment cancelled by user</li>
                  <li>Card expired or blocked</li>
                  <li>Bank declined the transaction</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/pricing')}
            className="w-full"
          >
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="pt-2">
          <Button 
            variant="ghost"
            onClick={() => navigate('/cbt')}
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Need help? Contact support at support@venobot.online
        </p>
      </div>
    </div>
  );
};

export default PaymentFailed;
