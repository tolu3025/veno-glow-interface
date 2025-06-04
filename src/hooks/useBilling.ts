
import { useState, useEffect } from 'react';
import { BillingService, FeatureType, UserFeatureAccess, UserPayment } from '@/services/billingService';

export const useBilling = () => {
  const [paymentHistory, setPaymentHistory] = useState<UserPayment[]>([]);
  const [loading, setLoading] = useState(false);

  const checkFeatureAccess = async (featureType: FeatureType): Promise<boolean> => {
    return await BillingService.hasFeatureAccess(featureType);
  };

  const getFeatureAccess = async (featureType: FeatureType): Promise<UserFeatureAccess | null> => {
    return await BillingService.getFeatureAccess(featureType);
  };

  const consumeFeatureAccess = async (featureType: FeatureType): Promise<boolean> => {
    return await BillingService.consumeFeatureAccess(featureType);
  };

  const createPaymentSession = async (featureType: FeatureType): Promise<string | null> => {
    return await BillingService.createPaymentSession(featureType);
  };

  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      const history = await BillingService.getPaymentHistory();
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  return {
    checkFeatureAccess,
    getFeatureAccess,
    consumeFeatureAccess,
    createPaymentSession,
    paymentHistory,
    loading,
    refreshPaymentHistory: loadPaymentHistory
  };
};
