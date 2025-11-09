
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingService, FeatureType } from "@/services/billingService";
import { CreditCard, Loader, CheckCircle, Crown, Zap, Calendar } from 'lucide-react';
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
  const planName = pricing.planName;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      const paymentId = await BillingService.createPaymentSession(featureType);
      
      if (paymentId) {
        // Payment initiated successfully - close dialog and let user complete in new tab
        setPaymentCompleted(true);
        
        // Close dialog after showing brief success message
        setTimeout(() => {
          onOpenChange(false);
          setPaymentCompleted(false);
          setIsProcessing(false);
          
          // Trigger callback to refresh access status
          onPaymentComplete?.();
        }, 2000);
      } else {
        setIsProcessing(false);
        toast.error('Failed to initiate payment. Please try again.');
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

  const IconComponent = featureType === 'manual_test' ? Crown : Zap;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-veno-primary" />
            Subscribe to {planName}
          </DialogTitle>
          <DialogDescription>
            Monthly subscription for unlimited {featureName.toLowerCase()} capabilities
          </DialogDescription>
        </DialogHeader>

        {paymentCompleted ? (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Redirecting to Payment...</h3>
            <p className="text-muted-foreground text-center">
              Complete your payment in the checkout page. You'll get unlimited access once payment is confirmed.
            </p>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5" />
                  {planName}
                </CardTitle>
                <CardDescription>
                  {featureType === 'manual_test' 
                    ? 'Unlimited manual test creation with full control over your content. Perfect for educators who want complete customization.'
                    : 'Unlimited AI-powered test generation. Choose from various subjects, topics, and difficulty levels with instant question creation.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Monthly Price:</span>
                    <span className="text-2xl font-bold text-veno-primary">{formattedAmount}</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      What's included:
                    </div>
                    <div>• Unlimited test creations</div>
                    <div>• {featureType === 'manual_test' ? 'Manual question input' : 'AI-powered question generation'}</div>
                    <div>• {featureType === 'manual_test' ? 'Custom subjects and topics' : 'Multiple subjects and difficulty levels'}</div>
                    <div>• Full access to test settings</div>
                    <div>• Results tracking and analytics</div>
                    <div>• Monthly billing cycle</div>
                    <div>• Cancel anytime</div>
                    <div>• {featureType === 'manual_test' ? 'Email support' : 'Priority support'}</div>
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
                className={featureType === 'manual_test' 
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600" 
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                }
              >
                {isProcessing ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Opening Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Subscribe for {formattedAmount}/month
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
