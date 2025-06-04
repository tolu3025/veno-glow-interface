
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, ArrowLeft, Sparkles, Calendar } from 'lucide-react';
import { BillingService } from '@/services/billingService';
import PaymentDialog from '@/components/billing/PaymentDialog';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const navigate = useNavigate();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<'manual_test' | 'ai_test'>('manual_test');
  const [hasManualAccess, setHasManualAccess] = useState(false);
  const [hasAiAccess, setHasAiAccess] = useState(false);
  const [manualAccessDetails, setManualAccessDetails] = useState<any>(null);
  const [aiAccessDetails, setAiAccessDetails] = useState<any>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const [manual, ai, manualDetails, aiDetails] = await Promise.all([
        BillingService.hasFeatureAccess('manual_test'),
        BillingService.hasFeatureAccess('ai_test'),
        BillingService.getFeatureAccess('manual_test'),
        BillingService.getFeatureAccess('ai_test')
      ]);
      setHasManualAccess(manual);
      setHasAiAccess(ai);
      setManualAccessDetails(manualDetails);
      setAiAccessDetails(aiDetails);
    };

    checkAccess();
  }, []);

  const handlePlanSelection = (featureType: 'manual_test' | 'ai_test') => {
    setSelectedFeature(featureType);
    setShowPaymentDialog(true);
  };

  const handlePaymentComplete = async () => {
    // Refresh access status
    const [manual, ai, manualDetails, aiDetails] = await Promise.all([
      BillingService.hasFeatureAccess('manual_test'),
      BillingService.hasFeatureAccess('ai_test'),
      BillingService.getFeatureAccess('manual_test'),
      BillingService.getFeatureAccess('ai_test')
    ]);
    setHasManualAccess(manual);
    setHasAiAccess(ai);
    setManualAccessDetails(manualDetails);
    setAiAccessDetails(aiDetails);
  };

  const starterPricing = BillingService.getFeaturePricing('manual_test');
  const proPricing = BillingService.getFeaturePricing('ai_test');

  const formatExpiry = (accessDetails: any) => {
    if (!accessDetails?.expires_at) return '';
    const expiryDate = new Date(accessDetails.expires_at);
    return expiryDate.toLocaleDateString();
  };

  const plans = [
    {
      name: "Starter Plan",
      price: `₦${(starterPricing.amount / 100).toLocaleString()}`,
      description: "Perfect for educators getting started with CBT",
      featureType: 'manual_test' as const,
      icon: Crown,
      color: "from-blue-500 to-cyan-500",
      popular: false,
      features: [
        "Unlimited manual test creations",
        "Custom questions and subjects",
        "Multiple choice questions",
        "Basic test settings",
        "Results tracking",
        "Email support",
        "Monthly subscription"
      ],
      hasAccess: hasManualAccess,
      accessDetails: manualAccessDetails
    },
    {
      name: "Pro Plan",
      price: `₦${(proPricing.amount / 100).toLocaleString()}`,
      description: "Advanced AI-powered test creation for professionals",
      featureType: 'ai_test' as const,
      icon: Zap,
      color: "from-purple-500 to-pink-500",
      popular: true,
      features: [
        "Unlimited AI test creations",
        "AI-generated questions",
        "Multiple subjects & topics",
        "Various difficulty levels",
        "Instant question generation",
        "Advanced analytics",
        "Priority support",
        "Monthly subscription"
      ],
      hasAccess: hasAiAccess,
      accessDetails: aiAccessDetails
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary mr-3"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-2xl font-semibold mb-4">Choose Your Monthly CBT Subscription</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the perfect monthly subscription for your test creation needs. Whether you prefer manual control 
          or AI-powered automation, we have the right solution for you.
        </p>
        <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          Monthly billing • Cancel anytime
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <Card className={`h-full ${plan.popular ? 'border-purple-200 shadow-lg' : ''} ${plan.hasAccess ? 'border-green-200 bg-green-50/30' : ''}`}>
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto h-12 w-12 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                  <plan.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                
                {plan.hasAccess && plan.accessDetails && (
                  <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      ✓ Active Subscription
                    </p>
                    {plan.accessDetails.expires_at && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Expires: {formatExpiry(plan.accessDetails)}
                      </p>
                    )}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{plan.price}</div>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanSelection(plan.featureType)}
                  className={`w-full ${
                    plan.hasAccess 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : plan.popular 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                  }`}
                  size="lg"
                  disabled={plan.hasAccess}
                >
                  {plan.hasAccess ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Active Subscription
                    </>
                  ) : (
                    <>
                      <plan.icon className="mr-2 h-4 w-4" />
                      Subscribe to {plan.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 bg-muted/30 p-8 rounded-lg max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-center">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">What's the difference between plans?</h4>
            <p className="text-sm text-muted-foreground">
              The Starter plan allows unlimited manual test creation, while the Pro plan 
              includes unlimited AI-powered question generation.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time. You'll continue to have access 
              until the end of your current billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Can I upgrade my plan?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can upgrade from Starter to Pro at any time. You can also have both subscriptions 
              if you want access to all features.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major payment methods through Flutterwave including cards, bank transfers, and mobile money.
            </p>
          </div>
        </div>
      </div>

      <PaymentDialog
        isOpen={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        featureType={selectedFeature}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default Pricing;
