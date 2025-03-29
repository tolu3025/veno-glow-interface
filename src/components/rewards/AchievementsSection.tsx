
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Award, Star, Trophy, Zap, BookOpen, CheckCircle, Target, Rocket, Users } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface AchievementsSectionProps {
  userPoints: number;
}

const AchievementsSection: React.FC<AchievementsSectionProps> = ({ userPoints }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  useEffect(() => {
    // In a real app, we would fetch user's achievements from the database
    // For now, generate mock data based on user points
    
    const generateAchievements = () => {
      const mockAchievements: Achievement[] = [
        {
          id: 'first_steps',
          title: 'First Steps',
          description: 'Complete your first task',
          icon: <CheckCircle className="h-8 w-8 text-emerald-500" />,
          progress: userPoints > 10 ? 1 : 0,
          maxProgress: 1,
          unlocked: userPoints > 10,
          type: 'bronze'
        },
        {
          id: 'quiz_master',
          title: 'Quiz Master',
          description: 'Create 5 tests',
          icon: <BookOpen className="h-8 w-8 text-indigo-500" />,
          progress: Math.min(Math.floor(userPoints / 50), 5),
          maxProgress: 5,
          unlocked: userPoints >= 250,
          type: 'silver'
        },
        {
          id: 'social_butterfly',
          title: 'Social Butterfly',
          description: 'Invite 10 friends',
          icon: <Users className="h-8 w-8 text-blue-500" />,
          progress: Math.min(Math.floor(userPoints / 100), 10),
          maxProgress: 10,
          unlocked: userPoints >= 1000,
          type: 'gold'
        },
        {
          id: 'knowledge_seeker',
          title: 'Knowledge Seeker',
          description: 'Take 20 tests',
          icon: <Target className="h-8 w-8 text-red-500" />,
          progress: Math.min(Math.floor(userPoints / 40), 20),
          maxProgress: 20,
          unlocked: userPoints >= 800,
          type: 'silver'
        },
        {
          id: 'power_user',
          title: 'Power User',
          description: 'Earn 1000 points',
          icon: <Zap className="h-8 w-8 text-yellow-500" />,
          progress: Math.min(userPoints, 1000),
          maxProgress: 1000,
          unlocked: userPoints >= 1000,
          type: 'gold'
        },
        {
          id: 'student_legend',
          title: 'Student Legend',
          description: 'Complete all basic achievements',
          icon: <Trophy className="h-8 w-8 text-yellow-500" />,
          progress: Math.min(userPoints >= 2000 ? 1 : 0, 1),
          maxProgress: 1,
          unlocked: userPoints >= 2000,
          type: 'platinum'
        },
        {
          id: 'completionist',
          title: 'Completionist',
          description: 'Complete 100 tasks on the platform',
          icon: <Rocket className="h-8 w-8 text-purple-500" />,
          progress: Math.min(Math.floor(userPoints / 20), 100),
          maxProgress: 100,
          unlocked: userPoints >= 2000,
          type: 'platinum'
        },
        {
          id: 'loyal_user',
          title: 'Loyal User',
          description: 'Log in for 30 consecutive days',
          icon: <Award className="h-8 w-8 text-orange-500" />,
          progress: Math.min(Math.floor(userPoints / 30), 30),
          maxProgress: 30,
          unlocked: userPoints >= 300,
          type: 'gold'
        },
      ];
      
      setAchievements(mockAchievements);
    };
    
    generateAchievements();
  }, [userPoints]);
  
  const getBadgeColor = (type: string) => {
    switch(type) {
      case 'bronze':
        return 'bg-amber-700/80';
      case 'silver':
        return 'bg-slate-400/80';
      case 'gold':
        return 'bg-yellow-500/80';
      case 'platinum':
        return 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500';
      default:
        return '';
    }
  };
  
  const getUnlockedCount = () => {
    return achievements.filter(a => a.unlocked).length;
  };
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" /> Your Achievements
          </CardTitle>
          <CardDescription>
            You've unlocked {getUnlockedCount()} of {achievements.length} achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="space-y-1 flex-1">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{getUnlockedCount()}/{achievements.length}</span>
              </div>
              <Progress
                value={(getUnlockedCount() / achievements.length) * 100}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.random() * 0.3 }}
            whileHover={achievement.unlocked ? { scale: 1.03 } : {}}
          >
            <Card className={`h-full ${achievement.unlocked ? '' : 'opacity-70 grayscale'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  <Badge className={`${getBadgeColor(achievement.type)} text-white`}>
                    {achievement.type.charAt(0).toUpperCase() + achievement.type.slice(1)}
                  </Badge>
                </div>
                <CardDescription>{achievement.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center py-2">
                  <div className={`p-3 rounded-full ${achievement.unlocked ? 'bg-primary/20' : 'bg-muted'}`}>
                    {achievement.icon}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.maxProgress}</span>
                  </div>
                  <Progress
                    value={(achievement.progress / achievement.maxProgress) * 100}
                    className="h-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsSection;
