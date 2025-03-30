import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star, Clock, BookOpen, CheckSquare, WifiOff, RefreshCw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  progress: number;
  unlocked: boolean;
  color: string;
  requiredValue: number;
  currentValue: number;
}

interface AchievementsSectionProps {
  userPoints: number;
}

type Activity = {
  type: string;
  task_id?: string;
  task_name?: string;
  points_earned?: number;
  timestamp?: string;
  blog_id?: string;
};

const AchievementsSection: React.FC<AchievementsSectionProps> = ({ userPoints }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (isOffline) {
          setLoading(false);
          return;
        }

        const { data: testAttempts, error: testError } = await supabase
          .from('test_attempts')
          .select('*')
          .eq('user_id', user.id);
        
        if (testError) {
          console.error("Error fetching test attempts:", testError);
          throw testError;
        }
        
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('activities')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw profileError;
        }
        
        const activities: Activity[] = Array.isArray(userProfile?.activities) 
          ? userProfile.activities as Activity[] 
          : [];
        
        let blogReadsCount = 0;
        const blogReadActivities = activities.filter(activity => activity.type === 'blog_read');
        
        if (blogReadActivities.length > 0) {
          if (blogReadActivities[0].blog_id) {
            const uniqueBlogIds = new Set(
              blogReadActivities
                .map(activity => activity.blog_id)
                .filter(id => id !== undefined)
            );
            blogReadsCount = uniqueBlogIds.size;
          } else {
            blogReadsCount = blogReadActivities.length;
          }
        }
        
        const tasksCompleted = activities.filter(activity => activity.type === 'task_completed').length;
        const perfectScoreTest = testAttempts?.some(test => 
          test.score === test.total_questions && test.total_questions > 0
        ) || false;
        
        const achievementData: Achievement[] = [
          {
            id: 'points_collector',
            title: 'Points Collector',
            description: 'Earn 500 points',
            icon: Star,
            progress: Math.min(userPoints / 500, 1),
            unlocked: userPoints >= 500,
            color: 'bg-amber-500',
            requiredValue: 500,
            currentValue: userPoints
          },
          {
            id: 'frequent_tester',
            title: 'Frequent Tester',
            description: 'Take 10 tests',
            icon: Clock,
            progress: Math.min((testAttempts?.length || 0) / 10, 1),
            unlocked: (testAttempts?.length || 0) >= 10,
            color: 'bg-purple-500',
            requiredValue: 10,
            currentValue: testAttempts?.length || 0
          },
          {
            id: 'bookworm',
            title: 'Bookworm',
            description: 'Read 5 blog articles',
            icon: BookOpen,
            progress: Math.min(blogReadsCount / 5, 1),
            unlocked: blogReadsCount >= 5,
            color: 'bg-blue-500',
            requiredValue: 5,
            currentValue: blogReadsCount
          },
          {
            id: 'perfect_score',
            title: 'Perfect Score',
            description: 'Get 100% on a test',
            icon: Trophy,
            progress: perfectScoreTest ? 1 : 0,
            unlocked: perfectScoreTest,
            color: 'bg-green-500',
            requiredValue: 1,
            currentValue: perfectScoreTest ? 1 : 0
          },
          {
            id: 'task_master',
            title: 'Task Master',
            description: 'Complete 5 tasks',
            icon: CheckSquare,
            progress: Math.min(tasksCompleted / 5, 1),
            unlocked: tasksCompleted >= 5,
            color: 'bg-veno-primary',
            requiredValue: 5,
            currentValue: tasksCompleted
          }
        ];
        
        setAchievements(achievementData);
      } catch (error) {
        console.error("Error fetching achievement data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, userPoints, isOffline]);

  if (isOffline) {
    return (
      <div className="space-y-6">
        <Card className="p-6 text-center">
          <div className="flex flex-col items-center">
            <WifiOff className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">You're currently offline</h3>
            <p className="text-muted-foreground mb-4">
              Please check your internet connection to view your achievements
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-veno-primary hover:bg-veno-primary/90 flex items-center gap-2"
            >
              <RefreshCw size={16} /> Reload page
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2 w-full mt-2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map(achievement => (
          <Card key={achievement.id} className={`p-4 relative overflow-hidden ${achievement.unlocked ? 'border-primary' : 'border-muted'}`}>
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                achievement.unlocked ? achievement.color : 'bg-muted'
              } mb-2`}>
                <achievement.icon className={`h-6 w-6 ${achievement.unlocked ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <h3 className="font-semibold">{achievement.title}</h3>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
              
              {achievement.unlocked ? (
                <Badge className="mt-2 bg-primary">Unlocked</Badge>
              ) : (
                <>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${achievement.progress * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {achievement.currentValue} / {achievement.requiredValue}
                  </p>
                </>
              )}
              
              {achievement.unlocked && (
                <div className="absolute -top-3 -right-3 w-24 h-24 opacity-10">
                  <achievement.icon className="w-full h-full text-primary" />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AchievementsSection;
