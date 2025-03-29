
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, ListChecks } from "lucide-react";
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
        title: "Complete your first test",
        description: "Take and complete your first quiz or test",
        points: 100,
        completed: false,
        type: "test",
        progress: 0
      },
      {
        id: "2",
        title: "Create a test",
        description: "Create your own test with at least 5 questions",
        points: 200,
        completed: false,
        type: "create",
        progress: 0
      },
      {
        id: "3",
        title: "Refer a friend",
        description: "Invite someone to join Veno",
        points: 150,
        completed: false,
        type: "referral",
        progress: 0
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
                    <Circle className="h-5 w-5 text-muted-foreground" />
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
