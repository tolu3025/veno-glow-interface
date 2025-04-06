
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Gift, List, UserCircle2, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

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
  const [isOffline, setIsOffline] = useState(false);
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      // Check if offline first
      if (!navigator.onLine) {
        setIsOffline(true);
        setIsLoading(false);
        toast({
          title: "You're offline",
          description: "Reward data will be limited until you're back online",
          variant: "default",
        });
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
                id: user.id,
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
            
            if (insertError) {
              console.error("Error creating user profile:", insertError);
              toast({
                title: "No points available",
                description: "We'll add points as you complete tasks",
                variant: "default",
              });
            } else {
              setUserPoints(100);
              toast({
                title: "Welcome to Rewards!",
                description: "We've given you 100 points to get started.",
              });
            }
          } else {
            console.error("Error fetching user profile:", error);
            toast({
              title: "No points available",
              description: "We'll add points as you complete tasks",
              variant: "default",
            });
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
          title: "No points available",
          description: "We'll add points as you complete tasks",
          variant: "default",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPoints();
    
    // Set up subscription to listen for point changes
    if (user && navigator.onLine) {
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
    }
  }, [user, toast, isOffline]);
  
  // Effect to update user points in Supabase when they change client-side
  useEffect(() => {
    const updateUserPoints = async () => {
      if (!user || isLoading || isOffline) return;
      
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ points: userPoints })
          .eq('user_id', user.id);
        
        if (error) {
          console.error("Error updating user points:", error);
          // Don't show error toast for this silent update
        }
      } catch (error) {
        console.error("Error updating user points:", error);
      }
    };
    
    // Only update if the user exists, points have loaded, and we're online
    if (user && !isLoading && !isOffline) {
      updateUserPoints();
    }
  }, [userPoints, user, isLoading, isOffline]);
  
  // Render offline page if detected
  if (isOffline) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Veno Rewards</h1>
        </div>
        
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center">
            <WifiOff className="h-16 w-16 text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">You're currently offline</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Veno Rewards requires an internet connection to track your progress and award points.
              Please check your connection and try again.
            </p>
            <Button 
              className="bg-veno-primary hover:bg-veno-primary/90"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Define coming soon component for tasks
  const ComingSoonOverlay = () => (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
      <span className="bg-amber-500 text-white text-sm px-3 py-1 rounded-full font-medium mb-2">
        Coming Soon
      </span>
      <p className="text-sm text-muted-foreground">Tasks are currently being developed</p>
    </div>
  );
  
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
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
          <div className="relative">
            <ComingSoonOverlay />
            <TasksSection userPoints={userPoints} setUserPoints={setUserPoints} />
          </div>
        </TabsContent>
        
        <TabsContent value="rewards" className="animate-fade-in">
          <div className="relative">
            <ComingSoonOverlay />
            <RewardsSection userPoints={userPoints} setUserPoints={setUserPoints} />
          </div>
        </TabsContent>
        
        <TabsContent value="achievements" className="animate-fade-in">
          <div className="relative">
            <ComingSoonOverlay />
            <AchievementsSection userPoints={userPoints} />
          </div>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="animate-fade-in">
          <div className="relative">
            <ComingSoonOverlay />
            <LeaderboardSection userPoints={userPoints} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RewardSystem;
