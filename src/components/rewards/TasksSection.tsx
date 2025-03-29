import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { CheckCircle, CircleDashed, LucideIcon } from "lucide-react";
import { appendActivityAndUpdatePoints } from "@/utils/activityHelpers";

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: LucideIcon;
  completed: boolean;
  action: () => Promise<boolean>;
}

interface TasksSectionProps {
  userPoints: number;
  setUserPoints: React.Dispatch<React.SetStateAction<number>>;
}

const TasksSection: React.FC<TasksSectionProps> = ({ userPoints, setUserPoints }) => {
  const { user } = useAuth();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [taskInProgress, setTaskInProgress] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchCompletedTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('activities')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        if (data && data.activities) {
          const activities = Array.isArray(data.activities) ? data.activities : [];
          
          const completedTaskIds = activities
            .filter((activity: any) => activity && activity.type === 'task_completed')
            .map((activity: any) => activity.task_id);
          
          setCompletedTasks(completedTaskIds);
        }
      } catch (error) {
        console.error("Error fetching completed tasks:", error);
      }
    };

    fetchCompletedTasks();
  }, [user]);

  const completeTask = async (taskId: string, points: number) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to complete tasks",
        variant: "destructive"
      });
      return;
    }
    
    setCompletingTask(taskId);
    
    try {
      const newActivity = {
        type: 'task_completed',
        task_id: taskId,
        timestamp: new Date().toISOString()
      };
      
      const success = await appendActivityAndUpdatePoints(user.id, newActivity, points);
      
      if (success) {
        setCompletedTasks([...completedTasks, taskId]);
        setUserPoints(prev => prev + points);
        
        toast({
          title: "Task completed!",
          description: `You earned ${points} points!`,
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Failed to complete task",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setCompletingTask('');
    }
  };

  const tasks: Task[] = [
    {
      id: 'create_test',
      title: 'Create Your First Test',
      description: 'Create a custom test in the CBT section',
      points: 50,
      icon: CircleDashed,
      completed: completedTasks.includes('create_test'),
      action: async () => {
        await completeTask('create_test', 50);
        return true;
      }
    },
    {
      id: 'complete_profile',
      title: 'Complete Your Profile',
      description: 'Add your details to your user profile',
      points: 30,
      icon: CircleDashed,
      completed: completedTasks.includes('complete_profile'),
      action: async () => {
        await completeTask('complete_profile', 30);
        return true;
      }
    },
    {
      id: 'first_referral',
      title: 'Refer a Friend',
      description: 'Invite a friend to join Veno',
      points: 100,
      icon: CircleDashed,
      completed: completedTasks.includes('first_referral'),
      action: async () => {
        await completeTask('first_referral', 100);
        return true;
      }
    },
    {
      id: 'take_test',
      title: 'Take a Test',
      description: 'Complete your first test in the CBT section',
      points: 40,
      icon: CircleDashed,
      completed: completedTasks.includes('take_test'),
      action: async () => {
        await completeTask('take_test', 40);
        return true;
      }
    }
  ];

  const completedTaskCount = completedTasks.length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTaskCount / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Overall Progress</h3>
          <span className="text-sm text-muted-foreground">
            {completedTaskCount} / {totalTasks} Tasks
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <motion.div 
            key={task.id}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Card className={`overflow-hidden ${task.completed ? 'bg-primary/5 border-primary/30' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <div className={`p-1.5 rounded-full ${task.completed ? 'bg-primary/20' : 'bg-muted'}`}>
                    {task.completed ? 
                      <CheckCircle className="h-5 w-5 text-primary" /> : 
                      <task.icon className="h-5 w-5 text-muted-foreground" />
                    }
                  </div>
                </div>
                <CardDescription>{task.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-2 flex justify-between items-center">
                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                  +{task.points} points
                </div>
                <Button 
                  variant={task.completed ? "secondary" : "default"}
                  size="sm"
                  disabled={loading || task.completed}
                  onClick={() => task.action()}
                  className={task.completed ? "pointer-events-none opacity-70" : ""}
                >
                  {taskInProgress === task.id ? (
                    <>
                      <span className="animate-spin mr-1">⟳</span> Processing...
                    </>
                  ) : task.completed ? (
                    'Completed'
                  ) : (
                    'Complete Task'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TasksSection;
