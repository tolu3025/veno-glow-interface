import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowLeft, Calendar, CreditCard, Tag, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { BillingService } from '@/services/billingService';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const txRef = searchParams.get('tx_ref');
  const transactionId = searchParams.get('transaction_id');
  const paymentId = searchParams.get('payment_id');
  const featureType = searchParams.get('feature_type');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (paymentId) {
        try {
          // Check if payment was actually successful
          const { data: payment, error } = await supabase
            .from('user_payments')
            .select('*')
            .eq('id', paymentId)
            .single();

          if (!error && payment && payment.status === 'completed') {
            // Payment was successful, show success details
            const pricing = BillingService.getFeaturePricing(payment.payment_type as any);
            setPaymentDetails({
              ...payment,
              planName: pricing.planName,
              formattedAmount: `₦${(payment.amount / 100).toLocaleString()}`
            });
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }
      setLoading(false);
    };

    checkPaymentStatus();
  }, [paymentId]);

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleRetryVerification = async () => {
    if (!transactionId || !txRef || !paymentId) {
      toast.error('Missing payment information. Please contact support.');
      return;
    }

    setIsRetrying(true);
    
    try {
      console.log('Retrying payment verification...', { transactionId, txRef, paymentId });
      
      // Call the flutterwave-callback function to manually verify
      const { data, error } = await supabase.functions.invoke('flutterwave-callback', {
        body: {
          transaction_id: transactionId,
          tx_ref: txRef,
          payment_id: paymentId,
          status: 'successful'
        }
      });

      if (error) throw error;

      console.log('Verification response:', data);
      
      if (data?.success) {
        toast.success('Payment verified successfully!');
        navigate('/payment/success');
      } else {
        toast.error(data?.message || 'Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Retry verification error:', error);
      toast.error('Failed to verify payment. Please contact support.');
    } finally {
      setIsRetrying(false);
    }
  };

  // If payment was actually successful, show success page
  if (paymentDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping opacity-20">
                  <div className="h-20 w-20 rounded-full bg-green-500" />
                </div>
                <CheckCircle className="h-20 w-20 text-green-500 relative z-10" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Your subscription has been activated successfully.
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm">Plan</span>
                  </div>
                  <span className="font-semibold">{paymentDetails.planName}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm">Amount Paid</span>
                  </div>
                  <span className="font-semibold text-green-600">{paymentDetails.formattedAmount}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Valid Until</span>
                  </div>
                  <span className="font-semibold">
                    {paymentDetails.expires_at 
                      ? new Date(paymentDetails.expires_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center">
                <p className="text-xs text-muted-foreground">
                  Transaction ID: {paymentDetails.id.slice(0, 8)}...
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              onClick={handlePrintReceipt}
              className="w-full"
              variant="outline"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button 
              onClick={() => navigate('/cbt')}
              className="w-full"
              size="lg"
            >
              Start Creating Tests
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Need help? Contact support at support@venobot.online
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If payment actually failed, show failure page
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <div className="flex justify-center">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Checking Payment Status</h1>
          <p className="text-muted-foreground">
            We're verifying your payment with Flutterwave. If you completed the payment, your subscription should be activated shortly.
          </p>
        </div>

        <div className="space-y-3">
          {txRef && transactionId && paymentId && (
            <Button
              onClick={handleRetryVerification}
              disabled={isRetrying}
              className="w-full"
            >
              <Printer className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Verifying...' : 'Verify Payment Status'}
            </Button>
          )}
          <Button 
            onClick={() => navigate('/cbt')}
            className="w-full"
          >
            Go to Dashboard
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

        <p className="text-sm text-muted-foreground">
          Need help? Contact support at support@venobot.online
        </p>
      </div>
    </div>
  );
};

export default PaymentFailed;
