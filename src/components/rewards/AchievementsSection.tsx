
import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star, Clock } from "lucide-react";

interface AchievementsSectionProps {
  userPoints: number;
}

const AchievementsSection: React.FC<AchievementsSectionProps> = ({ userPoints }) => {
  const achievements = [
    {
      id: 'points_collector',
      title: 'Points Collector',
      description: 'Earn 500 points',
      icon: Star,
      progress: Math.min(userPoints / 500, 1),
      unlocked: userPoints >= 500,
      color: 'bg-amber-500'
    },
    {
      id: 'frequent_tester',
      title: 'Frequent Tester',
      description: 'Take 10 tests',
      icon: Clock,
      progress: 0.3, // This would be dynamic in a real app
      unlocked: false,
      color: 'bg-purple-500'
    },
    {
      id: 'referral_master',
      title: 'Referral Master',
      description: 'Refer 5 friends',
      icon: Award,
      progress: 0.2, // This would be dynamic in a real app
      unlocked: false,
      color: 'bg-blue-500'
    },
    {
      id: 'perfect_score',
      title: 'Perfect Score',
      description: 'Get 100% on a test',
      icon: Trophy,
      progress: 0, // This would be dynamic in a real app
      unlocked: false,
      color: 'bg-green-500'
    }
  ];

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
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${achievement.progress * 100}%` }}
                  />
                </div>
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
