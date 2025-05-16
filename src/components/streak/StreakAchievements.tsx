
import React from "react";
import { useStreak } from "@/providers/StreakProvider";
import { GraduationCap, Lock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function StreakAchievements() {
  const { streak, isCourseUnlocked } = useStreak();
  
  // Define all available certification courses
  const certificationCourses = [
    { id: "basic-certification", name: "Basic Certification", requiredPoints: 50, difficulty: "Beginner" },
    { id: "intermediate-certification", name: "Intermediate Certification", requiredPoints: 100, difficulty: "Intermediate" },
    { id: "advanced-certification", name: "Advanced Certification", requiredPoints: 200, difficulty: "Advanced" },
    { id: "expert-certification", name: "Expert Certification", requiredPoints: 500, difficulty: "Expert" },
    { id: "master-certification", name: "Master Certification", requiredPoints: 1000, difficulty: "Master" }
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certificationCourses.map((course) => {
          const isUnlocked = isCourseUnlocked(course.id);
          const progress = Math.min(100, Math.round((streak.points / course.requiredPoints) * 100));
          
          return (
            <div 
              key={course.id} 
              className={cn(
                "p-4 border rounded-md transition-all",
                isUnlocked 
                  ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  : "bg-card"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className={cn(
                    "h-5 w-5",
                    isUnlocked ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                  )} />
                  <span className="font-medium">{course.name}</span>
                </div>
                {isUnlocked ? (
                  <Badge variant="success" className="ml-auto">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Unlocked
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted ml-auto">
                    <Lock className="h-3.5 w-3.5 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground mb-1">{course.difficulty}</div>
              
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{progress}% complete</span>
                  <span>{streak.points}/{course.requiredPoints} points</span>
                </div>
                <Progress 
                  value={progress}
                  className={cn(
                    "h-2",
                    isUnlocked ? "bg-green-100 dark:bg-green-950" : ""
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-muted/30 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-2">How to earn more points</h3>
        <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-4">
          <li>Visit the site daily to maintain your streak (+1 point per day)</li>
          <li>Watch educational videos (+10 points each)</li>
          <li>Explore new pages (+1 point per new page)</li>
          <li>Every 5 pages visited (+5 bonus points)</li>
          <li>Complete tests and quizzes (+20 points per completion)</li>
        </ul>
      </div>
    </div>
  );
}
