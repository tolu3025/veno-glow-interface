
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Gift, List, UserCircle2, Moon, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

import RewardsSection from '@/components/rewards/RewardsSection';
import TasksSection from '@/components/rewards/TasksSection';
import LeaderboardSection from '@/components/rewards/LeaderboardSection';
import AchievementsSection from '@/components/rewards/AchievementsSection';
import { VenoLogo } from '@/components/ui/logo';

const RewardSystem = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [userPoints, setUserPoints] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (!user) return;
      
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
          // Create a profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id, // UUID for the profile
              user_id: user.id,
              email: user.email,
              points: 100, // Start with some points
              activities: []
            });
          
          if (insertError) throw insertError;
          
          setUserPoints(100);
          toast({
            title: "Welcome to Rewards!",
            description: "We've given you 100 points to get started.",
          });
        }
      } catch (error) {
        console.error("Error fetching user points:", error);
      }
    };
    
    fetchUserPoints();
  }, [user, toast]);
  
  // Effect to update user points in Supabase when they change
  useEffect(() => {
    const updateUserPoints = async () => {
      if (!user) return;
      
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ points: userPoints })
          .eq('user_id', user.id);
        
        if (error) throw error;
      } catch (error) {
        console.error("Error updating user points:", error);
      }
    };
    
    // Only update if the user exists and points have been loaded
    if (user && userPoints !== 0) {
      updateUserPoints();
    }
  }, [userPoints, user]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <VenoLogo className="h-10 w-10 mr-3" />
          <h1 className="text-3xl font-bold">Veno Rewards</h1>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      <Card className="mb-8 border border-veno-primary/20 bg-gradient-to-br from-card/50 to-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1 flex items-center">
                <Trophy className="h-6 w-6 text-veno-primary mr-2" />
                Your Reward Points
              </h2>
              <p className="text-muted-foreground">Complete tasks, take quizzes, and earn rewards</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="text-3xl font-bold">{userPoints} <span className="text-veno-primary">pts</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="tasks" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="tasks" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            <List className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="rewards" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            <Gift className="h-4 w-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            <UserCircle2 className="h-4 w-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboard
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="animate-fade-in">
          <TasksSection userPoints={userPoints} setUserPoints={setUserPoints} />
        </TabsContent>
        
        <TabsContent value="rewards" className="animate-fade-in">
          <RewardsSection userPoints={userPoints} setUserPoints={setUserPoints} />
        </TabsContent>
        
        <TabsContent value="achievements" className="animate-fade-in">
          <AchievementsSection userPoints={userPoints} />
        </TabsContent>
        
        <TabsContent value="leaderboard" className="animate-fade-in">
          <LeaderboardSection userPoints={userPoints} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RewardSystem;
