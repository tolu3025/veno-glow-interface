
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { Gift, Terminal, Book, BookOpen, Glasses, Crown, Smartphone } from "lucide-react";
import confetti from 'canvas-confetti';

interface Reward {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  points: number;
  available: boolean;
}

interface RewardsSectionProps {
  userPoints: number;
  setUserPoints: React.Dispatch<React.SetStateAction<number>>;
}

const RewardsSection: React.FC<RewardsSectionProps> = ({ userPoints, setUserPoints }) => {
  const { user } = useAuth();
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  
  // Define available rewards
  const rewards: Reward[] = [
    {
      id: 'premium_week',
      title: '1 Week Premium',
      description: 'Access all premium features for 1 week',
      icon: <Crown className="h-10 w-10 text-yellow-500" />,
      points: 500,
      available: true,
    },
    {
      id: 'exam_unlock',
      title: 'Exam Bundle Unlock',
      description: 'Unlock a bundle of premium exam questions',
      icon: <BookOpen className="h-10 w-10 text-emerald-500" />,
      points: 300,
      available: true,
    },
    {
      id: 'study_guide',
      title: 'Study Guide',
      description: 'Access to a curated study guide for your exams',
      icon: <Book className="h-10 w-10 text-blue-500" />,
      points: 200,
      available: true,
    },
    {
      id: 'dark_theme',
      title: 'Custom Theme',
      description: 'Unlock a special dark theme for the app',
      icon: <Glasses className="h-10 w-10 text-purple-500" />,
      points: 100,
      available: true,
    },
    {
      id: 'mobile_access',
      title: 'Mobile Access',
      description: 'Early access to our upcoming mobile app',
      icon: <Smartphone className="h-10 w-10 text-indigo-500" />,
      points: 1000,
      available: true,
    },
    {
      id: 'code_snippet',
      title: 'Code Snippet Pack',
      description: 'Useful code snippets for developers',
      icon: <Terminal className="h-10 w-10 text-slate-500" />,
      points: 400,
      available: true,
    },
  ];

  const handleRewardClaim = async (reward: Reward) => {
    if (!user) return;
    
    // Check if user has enough points
    if (userPoints < reward.points) {
      toast.error(`You need ${reward.points - userPoints} more points to claim this reward`);
      return;
    }

    setClaimingReward(reward.id);
    
    try {
      // Update user points in the database
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          points: userPoints - reward.points,
          activities: supabase.sql`array_append(activities, jsonb_build_object('type', 'reward_claimed', 'reward_id', ${reward.id}, 'timestamp', ${new Date().toISOString()}))` 
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Trigger confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Update local state
      setUserPoints(userPoints - reward.points);
      
      toast.success(`You've claimed: ${reward.title}!`);
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast.error("Failed to claim reward");
    } finally {
      setClaimingReward(null);
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" /> Available Rewards
          </CardTitle>
          <CardDescription>
            Redeem your points for these exclusive rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <motion.div
                key={reward.id}
                whileHover={{ scale: 1.03, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.2)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="overflow-hidden h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg">{reward.title}</CardTitle>
                    <div className="p-2 bg-muted rounded-full">{reward.icon}</div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {reward.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="mt-auto pt-2 flex justify-between items-center">
                    <div className="text-sm font-semibold">
                      {reward.points} points
                    </div>
                    <Button 
                      variant={userPoints >= reward.points ? "default" : "outline"} 
                      size="sm"
                      disabled={userPoints < reward.points || claimingReward === reward.id}
                      onClick={() => handleRewardClaim(reward)}
                    >
                      {claimingReward === reward.id ? (
                        <span className="animate-pulse">Processing...</span>
                      ) : userPoints >= reward.points ? (
                        "Claim Reward"
                      ) : (
                        `Need ${reward.points - userPoints} more`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Complete various tasks to earn points:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Create a quiz/test: <span className="font-medium">50 points</span></li>
            <li>Complete your profile: <span className="font-medium">30 points</span></li> 
            <li>Take a test: <span className="font-medium">40 points</span></li>
            <li>Refer a friend: <span className="font-medium">100 points</span></li>
            <li>Daily login streak: <span className="font-medium">10 points/day</span></li>
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RewardsSection;
