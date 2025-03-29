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
  const [isOffline, setIsOffline] = useState<boolean>(false);
  
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
    const fetchTasks = async () => {
      if (!user) return;
      
      try {
        if (!navigator.onLine) {
          setIsOffline(true);
          return;
        }
        
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('activities')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching user profile:", error);
          throw error;
        }
        
        let activities: Activity[] = [];
        
        if (userProfile?.activities && typeof userProfile.activities === 'object') {
          if (Array.isArray(userProfile.activities)) {
            activities = userProfile.activities as Activity[];
          }
        }
          
        const completedTaskIds = activities
          .filter(activity => activity.type === 'task_completed')
          .map(activity => activity.task_id);
        
        const loginActivities = activities
          .filter(activity => activity.type === 'login')
          .sort((a, b) => {
            return new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime();
          });
        
        if (loginActivities.length > 0 && loginActivities[0].timestamp) {
          setLastLoginDate(loginActivities[0].timestamp);
          
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
        
        let testAttemptCount = 0;
        try {
          const { count, error: testError } = await supabase
            .from('test_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
            
          if (testError) {
            console.error("Error fetching test attempts:", testError);
          } else {
            testAttemptCount = count || 0;
          }
        } catch (err) {
          console.error("Exception fetching test attempts:", err);
        }
        
        const blogReadActivities = activities.filter(
          (activity: Activity) => activity.type === 'blog_read'
        );
        
        let blogReadCount = 0;
        if (blogReadActivities.length > 0) {
          if (blogReadActivities[0].blog_id) {
            const uniqueBlogIds = new Set(
              blogReadActivities
                .map(activity => activity.blog_id)
                .filter(id => id !== undefined)
            );
            blogReadCount = uniqueBlogIds.size;
          } else {
            blogReadCount = blogReadActivities.length;
          }
        }
        
        const adClickCount = activities.filter(
          (activity: Activity) => activity.type === 'ad_click'
        ).length;
        
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
              try {
                const today = new Date().toISOString().split('T')[0];
                if (!lastLoginDate) return false;
                
                const lastLogin = new Date(lastLoginDate).toISOString().split('T')[0];
                return lastLogin === today && loginStreak >= 10;
              } catch (err) {
                console.error("Login verification error:", err);
                return false;
              }
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
              try {
                const { data, error } = await supabase
                  .from('user_profiles')
                  .select('activities')
                  .eq('user_id', userId)
                  .maybeSingle();
                
                if (error) {
                  console.error("Blog verification error:", error);
                  return false;
                }
                
                let userActivities: Activity[] = [];
                if (data?.activities && typeof data.activities === 'object') {
                  if (Array.isArray(data.activities)) {
                    userActivities = data.activities as Activity[];
                  }
                }
                
                let uniqueBlogCount = 0;
                if (blogReadActivities.length > 0) {
                  if (blogReadActivities[0].blog_id) {
                    const uniqueBlogIds = new Set(
                      blogReadActivities
                        .map(activity => activity.blog_id)
                        .filter(id => id !== undefined)
                    );
                    uniqueBlogCount = uniqueBlogIds.size;
                  } else {
                    uniqueBlogCount = blogReadActivities.length;
                  }
                }
                
                return uniqueBlogCount >= 5;
              } catch (err) {
                console.error("Blog verification exception:", err);
                return false;
              }
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
              try {
                const { count, error } = await supabase
                  .from('test_attempts')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', userId);
                
                if (error) {
                  console.error("CBT verification error:", error);
                  return false;
                }
                
                return count !== null && count >= 3;
              } catch (err) {
                console.error("CBT verification exception:", err);
                return false;
              }
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
              const { data, error } = await supabase
                .from('user_profiles')
                .select('activities')
                .eq('user_id', userId)
                .maybeSingle();
              
              if (error) return false;
              
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
        setIsOffline(true);
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
            icon: MessageCircle,
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
    
    if (user) {
      const recordLoginActivity = async () => {
        try {
          const { data: userProfile, error } = await supabase
            .from('user_profiles')
            .select('activities')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (error && error.code !== 'PGRST116') {
            console.error("Error checking login activity:", error);
            throw error;
          }
          
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
      
      if (navigator.onLine) {
        recordLoginActivity();
      }
    }
    
    if (user && navigator.onLine) {
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
  }, [user, lastLoginDate, isOffline]);

  const handleCompleteTask = async (taskId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to sign in to complete tasks",
        variant: "destructive",
      });
      return;
    }

    if (!navigator.onLine) {
      toast({
        title: "Offline Mode",
        description: "You need an internet connection to complete tasks",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(taskId);
    
    try {
      const taskToUpdate = tasks.find(task => task.id === taskId);
      if (!taskToUpdate) return;
      
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
      
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      );
      setTasks(updatedTasks);
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ points: userPoints + taskToUpdate.points })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      setUserPoints(prev => prev + taskToUpdate.points);
      
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
  
  if (isOffline) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center">
          <ListChecks className="mr-2 h-5 w-5" /> Tasks
        </h2>
        
        <Card className="p-6 text-center">
          <div className="flex flex-col items-center">
            <div className="text-amber-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">You're currently offline</h3>
            <p className="text-muted-foreground mb-4">
              Please check your internet connection to view and complete tasks
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-veno-primary hover:bg-veno-primary/90"
            >
              Reload page
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
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
