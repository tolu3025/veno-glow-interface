import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Shield, CreditCard, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const PaymentProcessing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [verificationStep, setVerificationStep] = useState('Initializing...');

  useEffect(() => {
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 300);

    const verifyPayment = async () => {
      const status = searchParams.get('status');
      const transactionId = searchParams.get('transaction_id');
      const txRef = searchParams.get('tx_ref');
      const paymentId = searchParams.get('payment_id');
      const featureType = searchParams.get('feature_type');

      console.log('Payment processing params:', { status, transactionId, txRef, paymentId, featureType });

      // If we have payment_id and feature_type but no status yet, we're waiting for the callback
      if (paymentId && featureType && !status) {
        setVerificationStep('Waiting for payment...');
        setProgress(20);
        
        // Poll payment status from database
        const pollPaymentStatus = setInterval(async () => {
          try {
            const { data: payment, error } = await supabase
              .from('user_payments')
              .select('status')
              .eq('id', paymentId)
              .single();

            if (error) {
              console.error('Error checking payment status:', error);
              return;
            }

            console.log('Current payment status:', payment?.status);

            if (payment?.status === 'completed') {
              clearInterval(pollPaymentStatus);
              clearInterval(progressInterval);
              setVerificationStep('Payment confirmed!');
              setProgress(100);
              setTimeout(() => {
                navigate(`/payment/success?payment_id=${paymentId}&feature_type=${featureType}`);
              }, 500);
            } else if (payment?.status === 'failed') {
              clearInterval(pollPaymentStatus);
              clearInterval(progressInterval);
              navigate('/payment/failed');
            }
          } catch (error) {
            console.error('Error polling payment status:', error);
          }
        }, 2000); // Poll every 2 seconds

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(pollPaymentStatus);
          clearInterval(progressInterval);
          navigate('/payment/failed');
        }, 300000);

        return () => {
          clearInterval(pollPaymentStatus);
          clearInterval(progressInterval);
        };
      }

      setVerificationStep('Validating transaction...');
      setProgress(20);

      // If payment was cancelled or failed
      if (status === 'cancelled' || status === 'failed') {
        navigate('/payment/failed');
        return;
      }

      // If successful, verify with backend (this is when user is redirected back from Flutterwave)
      if (status === 'successful' && transactionId) {
        try {
          setVerificationStep('Verifying with payment provider...');
          setProgress(50);
          
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
            clearInterval(progressInterval);
            navigate('/payment/failed');
          } else {
            console.log('Payment verified successfully');
            setVerificationStep('Payment confirmed!');
            setProgress(100);
            clearInterval(progressInterval);
            setTimeout(() => {
              navigate(`/payment/success?payment_id=${paymentId}&feature_type=${featureType}`);
            }, 500);
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
          clearInterval(progressInterval);
          navigate('/payment/failed');
        }
        return;
      }

      // If no status yet, wait for redirect
      const timeout = setTimeout(() => {
        clearInterval(progressInterval);
        navigate('/payment/failed');
      }, 30000); // 30 seconds timeout

      return () => {
        clearTimeout(timeout);
        clearInterval(progressInterval);
      };
    };

    verifyPayment();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Main Loading Animation */}
        <div className="text-center space-y-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="h-24 w-24 rounded-full bg-primary" />
            </div>
            <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Processing Payment</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your payment. Do not close this window.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center animate-pulse">
            {verificationStep}
          </p>
        </div>

        {/* Verification Steps */}
        <div className="space-y-4 pt-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CreditCard className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium">Transaction Initiated</p>
              {progress >= 20 ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Skeleton className="h-4 w-24" />
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium">Security Verification</p>
              {progress >= 50 ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Skeleton className="h-4 w-24" />
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium">Payment Confirmation</p>
              {progress >= 90 ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Skeleton className="h-4 w-24" />
              )}
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="space-y-4 pt-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Secure payment processing • Typically completes in 10-15 seconds
            </p>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => navigate('/cbt')}
            className="w-full"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel and Return
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;
