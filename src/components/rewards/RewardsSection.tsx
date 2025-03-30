
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Award, Star, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { appendToUserActivities } from '@/utils/activityHelpers';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface RewardItemProps {
  id: string;
  name: string;
  description: string;
  points: number;
  available: boolean;
  userPoints: number;
  onRedeem: (id: string, points: number) => void;
}

const RewardItem: React.FC<RewardItemProps> = ({ 
  id, name, description, points, available, userPoints, onRedeem 
}) => {
  const canRedeem = userPoints >= points && available;
  
  return (
    <Card className={`border ${canRedeem ? 'border-veno-primary/30' : 'border-muted/50'}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium mb-1 flex items-center">
              {name}
              {!available && <Badge variant="outline" className="ml-2 text-xs">Coming Soon</Badge>}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            <div className="flex items-center text-sm font-medium">
              <Star className="h-4 w-4 text-amber-500 mr-1" />
              {points} points
            </div>
          </div>
          <Button 
            variant={canRedeem ? "default" : "outline"} 
            size="sm"
            disabled={!canRedeem}
            onClick={() => onRedeem(id, points)}
            className={canRedeem ? "bg-veno-primary hover:bg-veno-primary/90" : ""}
          >
            Redeem
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface RewardsSectionProps {
  userPoints: number;
  setUserPoints: React.Dispatch<React.SetStateAction<number>>;
}

const RewardsSection: React.FC<RewardsSectionProps> = ({ userPoints, setUserPoints }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [rewards, setRewards] = useState<Array<{
    id: string;
    name: string;
    description: string;
    points: number;
    available: boolean;
  }>>([]);
  
  useEffect(() => {
    // In a real app, these would come from Supabase
    setRewards([
      {
        id: "1",
        name: "Premium Study Materials",
        description: "Access premium study materials for one month",
        points: 500,
        available: true
      },
      {
        id: "2",
        name: "Test Certificate",
        description: "Get a certificate of completion for your tests",
        points: 1000,
        available: true
      },
      {
        id: "3",
        name: "Mock Exam Access",
        description: "Access to exclusive mock exams for your subjects",
        points: 1500,
        available: false
      },
      {
        id: "4",
        name: "One-on-One Tutoring",
        description: "30-minute session with a subject expert",
        points: 2500,
        available: false
      }
    ]);
  }, []);

  const handleReferralLink = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to sign in to generate a referral link",
        variant: "destructive",
      });
      return;
    }

    // Generate a unique referral code
    const referralCode = `${user.id.slice(0, 8)}`;
    const baseUrl = window.location.origin;
    const generatedLink = `${baseUrl}/signup?ref=${referralCode}`;
    
    setReferralLink(generatedLink);
    setShowReferralDialog(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied to clipboard!",
      description: "Your referral link has been copied to the clipboard",
    });
  };
  
  const handleRedeemReward = async (rewardId: string, pointsCost: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to sign in to redeem rewards",
        variant: "destructive",
      });
      return;
    }
    
    if (userPoints < pointsCost) {
      toast({
        title: "Insufficient Points",
        description: "You don't have enough points to redeem this reward",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Deduct points
      const { error } = await supabase
        .from('user_profiles')
        .update({ points: userPoints - pointsCost })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setUserPoints(prev => prev - pointsCost);
      
      // Find the reward details
      const reward = rewards.find(r => r.id === rewardId);
      
      if (reward) {
        // Log activity
        await appendToUserActivities(user.id, {
          type: "reward_redeemed",
          reward_id: rewardId,
          reward_name: reward.name,
          points_spent: pointsCost,
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "Reward Redeemed!",
          description: `You've redeemed: ${reward.name}`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast({
        title: "Error",
        description: "Failed to redeem reward. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <Gift className="mr-2 h-5 w-5" /> Rewards
        </h2>
        <div className="flex items-center">
          <Award className="text-amber-500 h-5 w-5 mr-1" />
          <span className="font-medium">{userPoints} points</span>
        </div>
      </div>
      
      <p className="text-muted-foreground">
        Redeem your earned points for these rewards.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {rewards.map((reward) => (
          <RewardItem
            key={reward.id}
            {...reward}
            userPoints={userPoints}
            onRedeem={handleRedeemReward}
          />
        ))}
      </div>

      <Card className="border-dashed border-2 border-veno-primary/30">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-2 flex items-center justify-center">
            <Share2 className="mr-2 h-5 w-5 text-veno-primary" /> 
            Refer a Friend
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share Veno with your friends and earn 100 points for each successful referral
          </p>
          <Button 
            onClick={handleReferralLink}
            className="bg-veno-primary hover:bg-veno-primary/90"
          >
            Get Referral Link
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Referral Link</DialogTitle>
            <DialogDescription>
              Share this link with your friends. When they sign up, you'll earn 100 points!
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="flex-1"
            />
            <Button onClick={copyToClipboard}>
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReferralDialog(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RewardsSection;
