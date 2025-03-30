
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, ListChecks, Calendar, MessageSquare, Award, MousePointer, ShoppingCart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { appendToUserActivities } from '@/utils/activityHelpers';

type Task = {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  type: string;
  progress?: number;
  icon: React.ElementType;
};

interface TasksSectionProps {
  userPoints: number;
  setUserPoints: React.Dispatch<React.SetStateAction<number>>;
}

const TasksSection: React.FC<TasksSectionProps> = ({ userPoints, setUserPoints }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  
  useEffect(() => {
    // In a real app, you would fetch this data from a database
    const mockTasks = [
      {
        id: "1",
        title: "Daily Login",
        description: "Login to the app daily (10 days)",
        points: 100, // 10 points x 10 days
        completed: false,
        type: "login",
        progress: 30, // 3 out of 10 days
        icon: Calendar
      },
      {
        id: "2",
        title: "Read Blog Posts",
        description: "Read blog posts (5 posts)",
        points: 25, // 5 points x 5 posts
        completed: false,
        type: "blog",
        progress: 40, // 2 out of 5 posts
        icon: MessageSquare
      },
      {
        id: "3",
        title: "Complete CBT Tests",
        description: "Complete CBT tests (3 tests)",
        points: 60, // 20 points x 3 tests
        completed: false,
        type: "cbt",
        progress: 33, // 1 out of 3 tests
        icon: Award
      },
      {
        id: "4",
        title: "Refer a Friend",
        description: "Invite someone to join Veno",
        points: 100,
        completed: false,
        type: "referral",
        progress: 0,
        icon: Award
      },
      {
        id: "5",
        title: "Click on Ads",
        description: "Click on sponsored ads (3 times)",
        points: 150, // 50 points x 3 clicks
        completed: false,
        type: "ads",
        progress: 0,
        icon: MousePointer
      },
      {
        id: "6",
        title: "Make a Purchase",
        description: "Make a purchase in the marketplace",
        points: 100,
        completed: false,
        type: "purchase",
        progress: 0,
        icon: ShoppingCart
      }
    ];
    
    setTasks(mockTasks);
  }, []);

  const handleCompleteTask = (taskId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to sign in to complete tasks",
        variant: "destructive",
      });
      return;
    }

    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;
    
    // Update task
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    ));
    
    // Add points
    setUserPoints(prev => prev + taskToUpdate.points);

    // In a real app, you would send this to your backend
    if (user) {
      appendToUserActivities(user.id, {
        type: "task_completed",
        task_id: taskId,
        task_name: taskToUpdate.title,
        points_earned: taskToUpdate.points,
        timestamp: new Date().toISOString()
      });
    }
    
    toast({
      title: "Task Completed!",
      description: `You've earned ${taskToUpdate.points} points`,
    });
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
        {tasks.map((task) => (
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
                        Progress: {task.progress}%
                      </p>
                    </div>
                  )}
                  
                  {!task.completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TasksSection;
