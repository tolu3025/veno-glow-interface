
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, ListChecks, Calendar, MessageCircle, Award, MousePointer, ShoppingCart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { appendToUserActivities } from '@/utils/activityHelpers';
import { supabase } from '@/integrations/supabase/client';

type Task = {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  type: string;
  progress?: number;
  icon: React.ElementType;
  verification: (userId: string) => Promise<boolean>;
};

interface TasksSectionProps {
  userPoints: number;
  setUserPoints: React.Dispatch<React.SetStateAction<number>>;
}

type Activity = {
  type: string;
  task_id?: string;
  task_name?: string;
  points_earned?: number;
  timestamp?: string;
};

const TasksSection: React.FC<TasksSectionProps> = ({ userPoints, setUserPoints }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);
  const [loginStreak, setLoginStreak] = useState<number>(0);
  
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      
      try {
        // Get user activities to check for completed tasks
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('activities')
          .eq('user_id', user.id)
          .maybeSingle(); // Using maybeSingle instead of single to handle no rows
        
        if (error && error.code !== 'PGRST116') throw error;
        
        // Properly type and handle the activities array
        let activities: Activity[] = [];
        
        if (userProfile?.activities && typeof userProfile.activities === 'object') {
          if (Array.isArray(userProfile.activities)) {
            activities = userProfile.activities as Activity[];
          }
        }
          
        const completedTaskIds = activities
          .filter(activity => activity.type === 'task_completed')
          .map(activity => activity.task_id);
        
        // Get login history
        const loginActivities = activities
          .filter(activity => activity.type === 'login')
          .sort((a, b) => {
            return new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime();
          });
        
        if (loginActivities.length > 0 && loginActivities[0].timestamp) {
          setLastLoginDate(loginActivities[0].timestamp);
          
          // Calculate login streak
          let streak = 1;
          let currentDate = new Date(loginActivities[0].timestamp);
          
          for (let i = 1; i < loginActivities.length; i++) {
            if (!loginActivities[i].timestamp) continue;
            
            const prevDate = new Date(loginActivities[i].timestamp);
            const timeDiff = currentDate.getTime() - prevDate.getTime();
            const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
            
            if (dayDiff === 1) {
              streak++;
              currentDate = prevDate;
            } else if (dayDiff > 1) {
              break;
            }
          }
          
          setLoginStreak(streak);
        }
        
        // Check CBT progress
        const { count: testAttemptCount, error: testError } = await supabase
          .from('test_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (testError) console.error("Error fetching test attempts:", testError);
        
        // Check blog read progress
        const blogReadCount = activities.filter(
          (activity: Activity) => activity.type === 'blog_read'
        ).length;
        
        // Check ad clicks
        const adClickCount = activities.filter(
          (activity: Activity) => activity.type === 'ad_click'
        ).length;
        
        // Define tasks with verification functions
        const tasksList: Task[] = [
          {
            id: "1",
            title: "Daily Login",
            description: "Login to the app daily (10 times for 100 points)",
            points: 100,
            completed: completedTaskIds.includes("1"),
            type: "login",
            progress: Math.min(loginStreak * 10, 100),
            icon: Calendar,
            verification: async (userId: string) => {
              // Check if user logged in today
              const today = new Date().toISOString().split('T')[0];
              if (!lastLoginDate) return false;
              
              const lastLogin = new Date(lastLoginDate).toISOString().split('T')[0];
              return lastLogin === today && loginStreak >= 10;
            }
          },
          {
            id: "2",
            title: "Read Blog Posts",
            description: "Read 5 blog posts to earn 25 points",
            points: 25,
            completed: completedTaskIds.includes("2"),
            type: "blog",
            progress: Math.min(blogReadCount * 20, 100),
            icon: MessageCircle,
            verification: async (userId: string) => {
              // Check if user has read blog posts
              const { data, error } = await supabase
                .from('user_profiles')
                .select('activities')
                .eq('user_id', userId)
                .maybeSingle();
              
              if (error) return false;
              
              // Properly handle the activities array
              let userActivities: Activity[] = [];
              if (data?.activities && typeof data.activities === 'object') {
                if (Array.isArray(data.activities)) {
                  userActivities = data.activities as Activity[];
                }
              }
                
              const blogReads = userActivities.filter(
                (activity: Activity) => activity.type === 'blog_read'
              ).length;
              
              return blogReads >= 5; // Require at least 5 blog reads
            }
          },
          {
            id: "3",
            title: "Complete CBT Tests",
            description: "Complete 3 CBT tests to earn 60 points",
            points: 60,
            completed: completedTaskIds.includes("3"),
            type: "cbt",
            progress: testAttemptCount ? Math.min((testAttemptCount / 3) * 100, 100) : 0,
            icon: Award,
            verification: async (userId: string) => {
              // Check if user has completed tests
              const { count, error } = await supabase
                .from('test_attempts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
              
              if (error) return false;
              
              return count !== null && count >= 3; // Require at least 3 test attempts
            }
          },
          {
            id: "4",
            title: "Refer a Friend",
            description: "Invite someone to join Veno (100 points)",
            points: 100,
            completed: completedTaskIds.includes("4"),
            type: "referral",
            progress: 0,
            icon: Award,
            verification: async (userId: string) => {
              // Check if user has referred anyone
              const { count, error } = await supabase
                .from('user_referrals')
                .select('*', { count: 'exact', head: true })
                .eq('referrer_id', userId);
              
              if (error) return false;
              
              return count !== null && count > 0;
            }
          },
          {
            id: "5",
            title: "Click on Ads",
            description: "Click on sponsored ads 3 times to earn 50 points",
            points: 50,
            completed: completedTaskIds.includes("5"),
            type: "ads",
            progress: Math.min(adClickCount * 33.33, 100),
            icon: MousePointer,
            verification: async (userId: string) => {
              // Check if user has clicked on ads
              const { data, error } = await supabase
                .from('user_profiles')
                .select('activities')
                .eq('user_id', userId)
                .maybeSingle();
              
              if (error) return false;
              
              // Properly handle the activities array
              let userActivities: Activity[] = [];
              if (data?.activities && typeof data.activities === 'object') {
                if (Array.isArray(data.activities)) {
                  userActivities = data.activities as Activity[];
                }
              }
                
              const adClicks = userActivities.filter(
                (activity: Activity) => activity.type === 'ad_click'
              ).length;
              
              return adClicks >= 3;
            }
          },
          {
            id: "6",
            title: "Make a Purchase",
            description: "Make a purchase in the marketplace (100 points)",
            points: 100,
            completed: completedTaskIds.includes("6"),
            type: "purchase",
            progress: 0,
            icon: ShoppingCart,
            verification: async (userId: string) => {
              // Check if user has made any purchases
              const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('buyer_id', userId);
              
              if (error) return false;
              
              return count !== null && count > 0;
            }
          }
        ];
        
        setTasks(tasksList);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        // Still set default tasks even if there's an error
        setTasks([
          {
            id: "1",
            title: "Daily Login",
            description: "Login to the app daily (10 times for 100 points)",
            points: 100,
            completed: false,
            type: "login",
            progress: 0,
            icon: Calendar,
            verification: async () => true
          },
          {
            id: "2",
            title: "Read Blog Posts",
            description: "Read 5 blog posts to earn 25 points",
            points: 25,
            completed: false,
            type: "blog",
            progress: 40,
            icon: MessageSquare,
            verification: async () => true
          },
          {
            id: "3",
            title: "Complete CBT Tests",
            description: "Complete 3 CBT tests to earn 60 points",
            points: 60,
            completed: false,
            type: "cbt",
            progress: 33,
            icon: Award,
            verification: async () => true
          },
          {
            id: "4",
            title: "Refer a Friend",
            description: "Invite someone to join Veno (100 points)",
            points: 100,
            completed: false,
            type: "referral",
            progress: 0,
            icon: Award,
            verification: async () => true
          },
          {
            id: "5",
            title: "Click on Ads",
            description: "Click on sponsored ads 3 times to earn 50 points",
            points: 50,
            completed: false,
            type: "ads",
            progress: 0,
            icon: MousePointer,
            verification: async () => true
          },
          {
            id: "6",
            title: "Make a Purchase",
            description: "Make a purchase in the marketplace (100 points)",
            points: 100,
            completed: false,
            type: "purchase",
            progress: 0,
            icon: ShoppingCart,
            verification: async () => true
          }
        ]);
      }
    };
    
    fetchTasks();
    
    // Record login activity if user is logged in
    if (user) {
      const recordLoginActivity = async () => {
        try {
          // Check if already logged in today
          const { data: userProfile, error } = await supabase
            .from('user_profiles')
            .select('activities')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (error && error.code !== 'PGRST116') throw error;
          
          let activities: Activity[] = [];
          if (userProfile?.activities && Array.isArray(userProfile.activities)) {
            activities = userProfile.activities as Activity[];
          }
          
          const today = new Date().toISOString().split('T')[0];
          const loggedInToday = activities.some(activity => 
            activity.type === 'login' && 
            activity.timestamp && 
            new Date(activity.timestamp).toISOString().split('T')[0] === today
          );
          
          if (!loggedInToday) {
            // Add login activity for today
            await appendToUserActivities(user.id, {
              type: 'login',
              timestamp: new Date().toISOString()
            });
            
            console.log("Recorded login activity for today");
          }
        } catch (error) {
          console.error("Error recording login activity:", error);
        }
      };
      
      recordLoginActivity();
    }
    
    // Set up realtime subscription for task updates
    if (user) {
      const channel = supabase
        .channel('tasks-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_profiles', filter: `user_id=eq.${user.id}` },
          () => fetchTasks()
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, lastLoginDate]);

  const handleCompleteTask = async (taskId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to sign in to complete tasks",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(taskId);
    
    try {
      const taskToUpdate = tasks.find(task => task.id === taskId);
      if (!taskToUpdate) return;
      
      // First verify the task is actually completed
      const isVerified = await taskToUpdate.verification(user.id);
      
      if (!isVerified) {
        toast({
          title: "Task Verification Failed",
          description: "You haven't completed this task yet",
          variant: "destructive",
        });
        setIsProcessing(null);
        return;
      }
      
      // Update task
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      );
      setTasks(updatedTasks);
      
      // Add points
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ points: userPoints + taskToUpdate.points })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setUserPoints(prev => prev + taskToUpdate.points);
      
      // Log activity
      await appendToUserActivities(user.id, {
        type: "task_completed",
        task_id: taskId,
        task_name: taskToUpdate.title,
        points_earned: taskToUpdate.points,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Task Completed!",
        description: `You've earned ${taskToUpdate.points} points`,
      });
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center">
        <ListChecks className="mr-2 h-5 w-5" /> Tasks
      </h2>
      
      <p className="text-muted-foreground">
        Complete these tasks to earn points.
      </p>
      
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className={`${task.completed ? 'bg-muted/30' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    {task.completed ? (
                      <CheckCircle className="h-5 w-5 text-veno-primary" />
                    ) : (
                      <task.icon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      <span className="text-sm font-medium text-veno-primary">
                        +{task.points} pts
                      </span>
                    </div>
                    
                    <p className={`text-sm ${task.completed ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                      {task.description}
                    </p>
                    
                    {task.progress !== undefined && task.progress > 0 && task.progress < 100 && (
                      <div className="mt-2">
                        <Progress value={task.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Progress: {Math.round(task.progress)}%
                        </p>
                      </div>
                    )}
                    
                    {!task.completed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 text-xs"
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={isProcessing === task.id}
                      >
                        {isProcessing === task.id ? "Verifying..." : "Complete"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TasksSection;
