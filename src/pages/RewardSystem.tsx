
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { Award, Gift, Star, Trophy, Users, UserPlus, CheckCircle, CircleDashed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LeaderboardSection from "@/components/rewards/LeaderboardSection";
import TasksSection from "@/components/rewards/TasksSection";
import RewardsSection from "@/components/rewards/RewardsSection";
import AchievementsSection from "@/components/rewards/AchievementsSection";

const RewardSystem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch user points
  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('points')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setUserPoints(data.points || 0);
        } else {
          // Create user profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({ 
              user_id: user.id,
              email: user.email,
              points: 0,
              activities: []
            });
            
          if (insertError) throw insertError;
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rewards & Referrals</h1>
            <p className="text-muted-foreground">Earn points, complete tasks, and climb the leaderboard</p>
          </div>
          
          <motion.div 
            className="flex items-center gap-2 bg-gradient-to-r from-primary/30 to-veno-accent/30 p-3 rounded-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Star className="h-5 w-5 text-primary fill-primary" />
            <span className="font-semibold">{userPoints} Points</span>
          </motion.div>
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CircleDashed className="h-4 w-4" /> Tasks
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Leaderboard
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="h-4 w-4" /> Rewards
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Achievements
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks">
            <TasksSection userPoints={userPoints} setUserPoints={setUserPoints} />
          </TabsContent>
          
          <TabsContent value="referrals">
            <LeaderboardSection userPoints={userPoints} />
          </TabsContent>
          
          <TabsContent value="rewards">
            <RewardsSection userPoints={userPoints} setUserPoints={setUserPoints} />
          </TabsContent>
          
          <TabsContent value="achievements">
            <AchievementsSection userPoints={userPoints} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default RewardSystem;
