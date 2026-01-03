import { supabase } from "@/integrations/supabase/client";

export type TransactionType = 'challenge_win' | 'leaderboard_reward' | 'feature_unlock' | 'admin_grant';

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: TransactionType;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface UserCoins {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  created_at: string;
  updated_at: string;
}

export interface FeatureUnlock {
  id: string;
  user_id: string;
  feature_type: string;
  unlocked_at: string;
  expires_at: string;
  coins_spent: number;
}

// Coin costs for features
export const FEATURE_COSTS = {
  voice_tutor: 100,
  analytics: 100,
  speed_challenge: 100,
} as const;

// Coin rewards
export const COIN_REWARDS = {
  challenge_win: 5,
  leaderboard_1st: 100,
  leaderboard_2nd: 60,
  leaderboard_3rd_to_10th: 5,
} as const;

export class CoinService {
  /**
   * Get the user's current coin balance
   */
  static async getCoinBalance(userId?: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) return 0;

    const { data, error } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching coin balance:', error);
      return 0;
    }

    return data?.balance || 0;
  }

  /**
   * Get full coin data for a user
   */
  static async getUserCoins(userId?: string): Promise<UserCoins | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from('user_coins')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user coins:', error);
      return null;
    }

    return data as UserCoins | null;
  }

  /**
   * Add coins to a user's balance
   */
  static async addCoins(
    amount: number,
    transactionType: TransactionType,
    description: string,
    referenceId?: string
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      // Ensure user_coins record exists
      await supabase
        .from('user_coins')
        .upsert({
          user_id: user.id,
          balance: 0,
          total_earned: 0,
        }, { onConflict: 'user_id' });

      // Create transaction record
      const { error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          amount,
          transaction_type: transactionType,
          description,
          reference_id: referenceId,
        });

      if (txError) {
        console.error('Error creating coin transaction:', txError);
        return false;
      }

      // Update balance directly
      const currentBalance = await this.getCoinBalance(user.id);
      const { error: updateError } = await supabase
        .from('user_coins')
        .update({
          balance: currentBalance + amount,
          total_earned: amount > 0 ? currentBalance + amount : undefined,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating coin balance:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding coins:', error);
      return false;
    }
  }

  /**
   * Deduct coins from a user's balance
   */
  static async deductCoins(
    amount: number,
    transactionType: TransactionType,
    description: string,
    referenceId?: string
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const currentBalance = await this.getCoinBalance(user.id);
    if (currentBalance < amount) {
      console.error('Insufficient coins');
      return false;
    }

    try {
      // Create transaction record (negative amount)
      const { error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          transaction_type: transactionType,
          description,
          reference_id: referenceId,
        });

      if (txError) {
        console.error('Error creating coin transaction:', txError);
        return false;
      }

      // Update balance
      const { error: updateError } = await supabase
        .from('user_coins')
        .update({ balance: currentBalance - amount })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating coin balance:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deducting coins:', error);
      return false;
    }
  }

  /**
   * Get transaction history for a user
   */
  static async getTransactionHistory(limit = 50): Promise<CoinTransaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }

    return data as CoinTransaction[];
  }

  /**
   * Unlock a feature with coins (24h access)
   */
  static async unlockFeatureWithCoins(
    featureType: keyof typeof FEATURE_COSTS
  ): Promise<{ success: boolean; expiresAt?: string; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const cost = FEATURE_COSTS[featureType];
    const balance = await this.getCoinBalance(user.id);

    if (balance < cost) {
      return { success: false, error: `Insufficient coins. Need ${cost}, have ${balance}` };
    }

    // Check if already has active unlock
    const existingUnlock = await this.hasActiveFeatureUnlock(featureType);
    if (existingUnlock) {
      return { success: false, error: 'Feature already unlocked' };
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    try {
      // Deduct coins
      const deducted = await this.deductCoins(
        cost,
        'feature_unlock',
        `Unlocked ${featureType} for 24 hours`
      );

      if (!deducted) {
        return { success: false, error: 'Failed to deduct coins' };
      }

      // Create unlock record
      const { error } = await supabase
        .from('feature_unlocks')
        .insert({
          user_id: user.id,
          feature_type: featureType,
          expires_at: expiresAt.toISOString(),
          coins_spent: cost,
        });

      if (error) {
        console.error('Error creating feature unlock:', error);
        return { success: false, error: 'Failed to create unlock' };
      }

      return { success: true, expiresAt: expiresAt.toISOString() };
    } catch (error) {
      console.error('Error unlocking feature:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  /**
   * Check if user has an active feature unlock
   */
  static async hasActiveFeatureUnlock(featureType: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('feature_unlocks')
      .select('expires_at')
      .eq('user_id', user.id)
      .eq('feature_type', featureType)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error('Error checking feature unlock:', error);
      return false;
    }

    return !!data;
  }

  /**
   * Get active unlock details
   */
  static async getActiveUnlock(featureType: string): Promise<FeatureUnlock | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('feature_unlocks')
      .select('*')
      .eq('user_id', user.id)
      .eq('feature_type', featureType)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .maybeSingle();

    if (error) {
      console.error('Error fetching active unlock:', error);
      return null;
    }

    return data as FeatureUnlock | null;
  }

  /**
   * Award coins for winning a challenge
   */
  static async awardChallengeWin(challengeId: string): Promise<boolean> {
    return this.addCoins(
      COIN_REWARDS.challenge_win,
      'challenge_win',
      'Won a streak challenge!',
      challengeId
    );
  }
}
