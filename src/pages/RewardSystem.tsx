
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Gift, List, UserCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

import RewardsSection from '@/components/rewards/RewardsSection';
import TasksSection from '@/components/rewards/TasksSection';
import LeaderboardSection from '@/components/rewards/LeaderboardSection';
import AchievementsSection from '@/components/rewards/AchievementsSection';

const RewardSystem = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [userPoints, setUserPoints] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('points, activities')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // No profile found, create one
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                email: user.email,
                points: 100, // Start with some points
                activities: [{
                  type: 'login',
                  description: 'First login',
                  timestamp: new Date().toISOString(),
                  points: 100
                }]
              });
            
            if (insertError) throw insertError;
            
            setUserPoints(100);
            toast({
              title: "Welcome to Rewards!",
              description: "We've given you 100 points to get started.",
            });
          } else {
            throw error;
          }
        } else if (data) {
          setUserPoints(data.points || 0);
          
          // Check for login activity only if profile exists
          if (Array.isArray(data.activities)) {
            const today = new Date().toISOString().split('T')[0];
            const loggedInToday = data.activities.some((activity: any) => 
              activity.type === 'login' && 
              activity.timestamp && 
              new Date(activity.timestamp).toISOString().split('T')[0] === today
            );
            
            if (!loggedInToday) {
              console.log("User has not logged in today yet");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user points:", error);
        toast({
          title: "Error",
          description: "Failed to fetch your reward points. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPoints();
    
    // Set up subscription to listen for point changes
    const channel = supabase.channel('user-points-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.points === 'number') {
            setUserPoints(payload.new.points);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);
  
  // Effect to update user points in Supabase when they change client-side
  // This ensures persistence across sessions
  useEffect(() => {
    const updateUserPoints = async () => {
      if (!user || isLoading) return;
      
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
    
    // Only update if the user exists and points have loaded
    if (user && !isLoading) {
      updateUserPoints();
    }
  }, [userPoints, user, isLoading]);
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Veno Rewards</h1>
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
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-veno-primary"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="text-3xl font-bold">{userPoints} <span className="text-veno-primary">pts</span></div>
              )}
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
