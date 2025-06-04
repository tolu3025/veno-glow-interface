
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingService, FeatureType } from "@/services/billingService";
import { CreditCard, Loader, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  featureType: FeatureType;
  onPaymentComplete?: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onOpenChange,
  featureType,
  onPaymentComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const pricing = BillingService.getFeaturePricing(featureType);
  const featureName = featureType === 'manual_test' ? 'Manual Test Creation' : 'AI-Powered Test Creation';
  const formattedAmount = `₦${(pricing.amount / 100).toLocaleString()}`;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      const paymentId = await BillingService.createPaymentSession(featureType);
      
      if (paymentId) {
        // Simulate payment processing
        setTimeout(() => {
          setPaymentCompleted(true);
          setIsProcessing(false);
          
          // Auto close and trigger callback after 2 seconds
          setTimeout(() => {
            onPaymentComplete?.();
            onOpenChange(false);
            setPaymentCompleted(false);
          }, 2000);
        }, 2000);
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
      setPaymentCompleted(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to {featureName}</DialogTitle>
          <DialogDescription>
            Unlock advanced test creation capabilities
          </DialogDescription>
        </DialogHeader>

        {paymentCompleted ? (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground text-center">
              You now have access to {featureName.toLowerCase()}. 
              You'll be redirected shortly.
            </p>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {featureName}
                </CardTitle>
                <CardDescription>
                  {featureType === 'manual_test' 
                    ? 'Create custom tests with your own questions and subjects'
                    : 'Generate tests automatically using AI with various subjects and difficulty levels'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Price:</span>
                    <span className="text-2xl font-bold text-veno-primary">{formattedAmount}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    • 5 test creations included
                    • No expiration date
                    • Full access to all features
                    • Priority support
                  </div>
                </div>
              </CardContent>
            </Card>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                onClick={handlePayment} 
                disabled={isProcessing}
                className="bg-veno-primary hover:bg-veno-primary/90"
              >
                {isProcessing ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay {formattedAmount}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
