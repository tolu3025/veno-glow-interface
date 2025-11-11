import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const PaymentProcessing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyPayment = async () => {
      const status = searchParams.get('status');
      const transactionId = searchParams.get('transaction_id');
      const txRef = searchParams.get('tx_ref');
      const paymentId = searchParams.get('payment_id');
      const featureType = searchParams.get('feature_type');

      console.log('Payment processing params:', { status, transactionId, txRef, paymentId, featureType });

      // If payment was cancelled or failed
      if (status === 'cancelled' || status === 'failed') {
        navigate('/payment/failed');
        return;
      }

      // If successful, verify with backend
      if (status === 'successful' && transactionId) {
        try {
          const { data, error } = await supabase.functions.invoke('flutterwave-callback', {
            body: { 
              status, 
              transaction_id: transactionId, 
              tx_ref: txRef,
              payment_id: paymentId,
              feature_type: featureType
            }
          });

          if (error) {
            console.error('Payment verification error:', error);
            navigate('/payment/failed');
          } else {
            console.log('Payment verified successfully');
            navigate('/payment/success');
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
          navigate('/payment/failed');
        }
        return;
      }

      // If no status yet, wait for redirect
      const timeout = setTimeout(() => {
        navigate('/payment/failed');
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeout);
    };

    verifyPayment();
  }, [navigate, searchParams]);

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
