
import React, { useState, useEffect } from 'react';
import { BillingService, FeatureType } from '@/services/billingService';
import PaymentDialog from './PaymentDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Zap } from 'lucide-react';

interface FeatureAccessGuardProps {
  featureType: FeatureType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FeatureAccessGuard: React.FC<FeatureAccessGuardProps> = ({
  featureType,
  children,
  fallback
}) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [accessDetails, setAccessDetails] = useState<any>(null);

  const checkAccess = async () => {
    const access = await BillingService.hasFeatureAccess(featureType);
    const details = await BillingService.getFeatureAccess(featureType);
    setHasAccess(access);
    setAccessDetails(details);
  };

  useEffect(() => {
    checkAccess();
  }, [featureType]);

  const handlePaymentComplete = () => {
    checkAccess(); // Refresh access status
  };

  if (hasAccess === null) {
    // Loading state
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-veno-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasAccess) {
    return (
      <div>
        {accessDetails && !accessDetails.unlimited_access && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <Crown className="inline h-4 w-4 mr-1" />
              You have {accessDetails.access_count} remaining uses for this feature.
            </p>
          </div>
        )}
        {children}
      </div>
    );
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const pricing = BillingService.getFeaturePricing(featureType);
  const featureName = featureType === 'manual_test' ? 'Manual Test Creation' : 'AI-Powered Test Creation';
  const formattedAmount = `₦${(pricing.amount / 100).toLocaleString()}`;
  const planName = pricing.planName;

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
            {featureType === 'manual_test' ? (
              <Lock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            )}
          </div>
          <CardTitle>Unlock {planName}</CardTitle>
          <CardDescription>
            This is a premium feature. Upgrade to access {featureName.toLowerCase()} with {pricing.accessCount} test creations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">What you'll get:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {featureType === 'manual_test' ? (
                  <>
                    <li>• Create custom tests with your own questions</li>
                    <li>• Add multiple subjects and topics</li>
                    <li>• Set custom difficulty levels</li>
                    <li>• Manage test settings and time limits</li>
                  </>
                ) : (
                  <>
                    <li>• Generate tests automatically using AI</li>
                    <li>• Choose from various subjects and topics</li>
                    <li>• Adjust difficulty and question count</li>
                    <li>• Get instant question generation</li>
                  </>
                )}
                <li>• {pricing.accessCount} test creations included</li>
                <li>• No expiration date</li>
                <li>• {featureType === 'manual_test' ? 'Email support' : 'Priority support'}</li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-veno-primary">{formattedAmount}</div>
              <p className="text-sm text-muted-foreground">One-time payment • {pricing.accessCount} test creations</p>
            </div>
          </div>

          <Button 
            onClick={() => setShowPaymentDialog(true)}
            className={featureType === 'manual_test' 
              ? "w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600" 
              : "w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            }
            size="lg"
          >
            <Crown className="mr-2 h-4 w-4" />
            Get {planName}
          </Button>
        </CardContent>
      </Card>

      <PaymentDialog
        isOpen={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        featureType={featureType}
        onPaymentComplete={handlePaymentComplete}
      />
    </>
  );
};

export default FeatureAccessGuard;
