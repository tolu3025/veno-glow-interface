
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type FeatureType = 'manual_test' | 'ai_test';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface UserFeatureAccess {
  id: string;
  user_id: string;
  feature_type: FeatureType;
  access_count: number;
  unlimited_access: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPayment {
  id: string;
  user_id: string;
  payment_type: FeatureType;
  amount: number;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: PaymentStatus;
  region: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export class BillingService {
  /**
   * Check if user has access to a specific feature
   */
  static async hasFeatureAccess(featureType: FeatureType): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_feature_access')
        .select('*')
        .eq('user_id', user.id)
        .eq('feature_type', featureType)
        .single();

      if (error) {
        console.log('No feature access found:', error.message);
        return false;
      }

      if (!data) return false;

      // Check if access has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return false;
      }

      // Check if they have remaining access count or unlimited access
      return data.unlimited_access || data.access_count > 0;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get user's feature access details
   */
  static async getFeatureAccess(featureType: FeatureType): Promise<UserFeatureAccess | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_feature_access')
        .select('*')
        .eq('user_id', user.id)
        .eq('feature_type', featureType)
        .single();

      if (error) {
        console.log('No feature access found:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting feature access:', error);
      return null;
    }
  }

  /**
   * Consume one access count for a feature
   */
  static async consumeFeatureAccess(featureType: FeatureType): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const currentAccess = await this.getFeatureAccess(featureType);
      if (!currentAccess) return false;

      // Don't consume if unlimited access
      if (currentAccess.unlimited_access) return true;

      // Check if they have remaining access
      if (currentAccess.access_count <= 0) return false;

      // Decrease access count
      const { error } = await supabase
        .from('user_feature_access')
        .update({ 
          access_count: currentAccess.access_count - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentAccess.id);

      if (error) {
        console.error('Error consuming feature access:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error consuming feature access:', error);
      return false;
    }
  }

  /**
   * Get pricing for a feature based on user's region
   */
  static getFeaturePricing(featureType: FeatureType, region?: string): { amount: number; currency: string } {
    // Default to Nigerian pricing
    const defaultPricing = {
      manual_test: { amount: 100000, currency: 'NGN' }, // ₦1000 in kobo
      ai_test: { amount: 200000, currency: 'NGN' } // ₦2000 in kobo
    };

    // For other regions, you can add more pricing logic here
    // For now, we'll stick with NGN pricing
    return defaultPricing[featureType];
  }

  /**
   * Create a payment session for a feature
   */
  static async createPaymentSession(featureType: FeatureType): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to continue');
        return null;
      }

      // Get pricing for the feature
      const pricing = this.getFeaturePricing(featureType);
      
      // Create payment record
      const { data: payment, error } = await supabase
        .from('user_payments')
        .insert({
          user_id: user.id,
          payment_type: featureType,
          amount: pricing.amount,
          currency: pricing.currency,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payment record:', error);
        toast.error('Failed to create payment session');
        return null;
      }

      // For now, simulate payment completion (in real implementation, integrate with Stripe)
      // This is a placeholder - you would integrate with actual payment gateway
      setTimeout(async () => {
        await this.completePayment(payment.id, featureType);
      }, 2000);

      return payment.id;
    } catch (error) {
      console.error('Error creating payment session:', error);
      toast.error('Failed to create payment session');
      return null;
    }
  }

  /**
   * Complete a payment and grant feature access
   */
  static async completePayment(paymentId: string, featureType: FeatureType): Promise<void> {
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('user_payments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) {
        console.error('Error updating payment:', paymentError);
        return;
      }

      // Get user from payment
      const { data: payment } = await supabase
        .from('user_payments')
        .select('user_id')
        .eq('id', paymentId)
        .single();

      if (!payment) return;

      // Grant or update feature access
      const { error: accessError } = await supabase
        .from('user_feature_access')
        .upsert({
          user_id: payment.user_id,
          feature_type: featureType,
          access_count: 5, // Grant 5 uses per payment
          unlimited_access: false,
          expires_at: null, // No expiration for now
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,feature_type'
        });

      if (accessError) {
        console.error('Error granting feature access:', accessError);
        return;
      }

      toast.success(`Payment completed! You now have access to ${featureType.replace('_', ' ')} creation.`);
    } catch (error) {
      console.error('Error completing payment:', error);
    }
  }

  /**
   * Get user's payment history
   */
  static async getPaymentHistory(): Promise<UserPayment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }
}
