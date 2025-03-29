
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { appendActivityAndUpdatePoints } from '@/utils/activityHelpers';

// Define a reward interface
interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
}

// Define mock rewards as we don't have a rewards table
const AVAILABLE_REWARDS: Reward[] = [
  {
    id: 'discount_10',
    title: '10% Discount',
    description: 'Get 10% off on your next purchase',
    points: 50
  },
  {
    id: 'premium_1month',
    title: '1 Month Premium',
    description: 'Get 1 month of premium features',
    points: 100
  },
  {
    id: 'custom_badge',
    title: 'Custom Profile Badge',
    description: 'Get a unique badge for your profile',
    points: 75
  },
  {
    id: 'priority_support',
    title: 'Priority Support',
    description: 'Get priority customer support for 1 month',
    points: 150
  }
];

const RewardsSection = ({ userPoints, setUserPoints }: { userPoints: number; setUserPoints: React.Dispatch<React.SetStateAction<number>> }) => {
  const { user } = useAuth();
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [claimingReward, setClaimingReward] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('activities')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      
      // Extract claimed rewards from activities
      if (data && data.activities && Array.isArray(data.activities)) {
        const claimed = data.activities
          .filter(a => a && typeof a === 'object' && a.type === 'reward_claimed')
          .map(a => a.reward_id);
        
        setClaimedRewards(claimed);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (reward: Reward) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to claim rewards"
      });
      return;
    }
    
    if (userPoints < reward.points) {
      toast({
        title: "Not enough points",
        description: `You need ${reward.points - userPoints} more points to claim this reward`
      });
      return;
    }
    
    setClaimingReward(reward.id);
    
    try {
      const newActivity = {
        type: 'reward_claimed',
        reward_id: reward.id,
        timestamp: new Date().toISOString()
      };
      
      const success = await appendActivityAndUpdatePoints(user.id, newActivity, -reward.points);
      
      if (success) {
        // Update local state
        setUserPoints(prev => prev - reward.points);
        setClaimedRewards([...claimedRewards, reward.id]);
        
        toast({
          title: "Reward claimed!",
          description: `You have spent ${reward.points} points`
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast({
        title: "Failed to claim reward",
        description: "Please try again later"
      });
    } finally {
      setClaimingReward('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Available Rewards</h2>
        {user && (
          <div className="bg-veno-primary/10 text-veno-primary px-3 py-1 rounded-full text-sm font-medium">
            Your Points: {userPoints}
          </div>
        )}
      </div>

      {!user ? (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">Please log in to view and claim rewards</p>
        </div>
      ) : AVAILABLE_REWARDS.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">No rewards available at the moment</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE_REWARDS.map((reward) => {
            const isClaimed = claimedRewards.includes(reward.id);
            const canClaim = userPoints >= reward.points && !isClaimed;
            
            return (
              <div 
                key={reward.id}
                className={`border rounded-lg p-4 ${
                  isClaimed 
                    ? 'bg-muted/30 border-muted' 
                    : canClaim 
                      ? 'border-veno-primary/30' 
                      : 'border-muted'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{reward.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    canClaim ? 'bg-veno-primary/20 text-veno-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {reward.points} points
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                <button
                  onClick={() => claimReward(reward)}
                  disabled={!canClaim || claimingReward === reward.id}
                  className={`w-full py-1.5 rounded-md text-sm font-medium ${
                    isClaimed 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : canClaim 
                        ? 'bg-veno-primary text-white hover:bg-veno-primary/90' 
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {claimingReward === reward.id 
                    ? 'Processing...' 
                    : isClaimed 
                      ? 'Claimed' 
                      : canClaim 
                        ? 'Claim Reward' 
                        : `Need ${reward.points - userPoints} more points`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RewardsSection;
