import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowLeft, Calendar, CreditCard, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { BillingService } from '@/services/billingService';
import { Skeleton } from '@/components/ui/skeleton';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      const paymentId = searchParams.get('payment_id');
      const featureType = searchParams.get('feature_type');

      if (paymentId) {
        try {
          const { data: payment, error } = await supabase
            .from('user_payments')
            .select('*')
            .eq('id', paymentId)
            .single();

          if (error) throw error;

          // Get pricing details for plan name
          const pricing = BillingService.getFeaturePricing(payment.payment_type as any);

          setPaymentDetails({
            ...payment,
            planName: pricing.planName,
            formattedAmount: `₦${(payment.amount / 100).toLocaleString()}`
          });
        } catch (error) {
          console.error('Error fetching payment details:', error);
        }
      }
      setLoading(false);
    };

    fetchPaymentDetails();

    // Auto-redirect after 10 seconds
    const timeout = setTimeout(() => {
      navigate('/cbt');
    }, 10000);

    return () => clearTimeout(timeout);
  }, [navigate, searchParams]);

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

        {loading ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ) : paymentDetails ? (
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
        ) : null}

        <div className="space-y-3">
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
          Redirecting automatically in 10 seconds...
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
