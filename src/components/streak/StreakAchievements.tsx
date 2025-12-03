import React from "react";
import { useStreak } from "@/providers/StreakProvider";
import { Award, Lock, CheckCircle2, Star, Zap, Target, Flame, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function StreakAchievements() {
  const { streak, isCourseUnlocked } = useStreak();
  
  // Define all available certification courses with icons and gradients
  const certificationCourses = [
    { 
      id: "basic-certification", 
      name: "Basic Scholar", 
      requiredPoints: 50, 
      difficulty: "Beginner",
      icon: Star,
      gradient: "from-slate-400 to-slate-500",
      unlockedGradient: "from-green-400 to-emerald-500"
    },
    { 
      id: "intermediate-certification", 
      name: "Rising Star", 
      requiredPoints: 100, 
      difficulty: "Intermediate",
      icon: Zap,
      gradient: "from-blue-400 to-cyan-500",
      unlockedGradient: "from-blue-400 to-cyan-500"
    },
    { 
      id: "advanced-certification", 
      name: "Knowledge Seeker", 
      requiredPoints: 200, 
      difficulty: "Advanced",
      icon: Target,
      gradient: "from-purple-400 to-violet-500",
      unlockedGradient: "from-purple-400 to-violet-500"
    },
    { 
      id: "expert-certification", 
      name: "Expert Mind", 
      requiredPoints: 500, 
      difficulty: "Expert",
      icon: Flame,
      gradient: "from-orange-400 to-red-500",
      unlockedGradient: "from-orange-400 to-red-500"
    },
    { 
      id: "master-certification", 
      name: "Grand Master", 
      requiredPoints: 1000, 
      difficulty: "Master",
      icon: Award,
      gradient: "from-amber-400 to-yellow-500",
      unlockedGradient: "from-amber-400 to-yellow-500"
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certificationCourses.map((course, index) => {
          const isUnlocked = isCourseUnlocked(course.id);
          const progress = Math.min(100, Math.round((streak.points / course.requiredPoints) * 100));
          const Icon = course.icon;
          
          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative overflow-hidden rounded-xl transition-all",
                isUnlocked 
                  ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10"
                  : "bg-card border"
              )}
            >
              {/* Glow effect for unlocked */}
              {isUnlocked && (
                <div className={cn(
                  "absolute inset-0 opacity-20 blur-xl",
                  "bg-gradient-to-r", course.unlockedGradient
                )} />
              )}
              
              <div className="relative p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <motion.div 
                    className={cn(
                      "p-2.5 rounded-xl",
                      isUnlocked 
                        ? cn("bg-gradient-to-br shadow-lg", course.unlockedGradient)
                        : "bg-muted"
                    )}
                    animate={isUnlocked ? { 
                      boxShadow: [
                        "0 0 15px rgba(255,255,255,0.2)",
                        "0 0 25px rgba(255,255,255,0.4)",
                        "0 0 15px rgba(255,255,255,0.2)"
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Icon className={cn(
                      "h-5 w-5",
                      isUnlocked ? "text-white" : "text-muted-foreground"
                    )} />
                  </motion.div>
                  
                  {isUnlocked ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30"
                    >
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      <span className="text-[10px] font-semibold text-green-400 uppercase">Unlocked</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                      <Lock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Locked</span>
                    </div>
                  )}
                </div>
                
                {/* Title & Difficulty */}
                <h3 className={cn(
                  "font-bold text-sm mb-1",
                  isUnlocked ? "text-white" : "text-foreground"
                )}>
                  {course.name}
                </h3>
                <p className={cn(
                  "text-xs mb-3",
                  isUnlocked ? "text-white/60" : "text-muted-foreground"
                )}>
                  {course.difficulty} Level
                </p>
                
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className={isUnlocked ? "text-white/60" : "text-muted-foreground"}>
                      {isUnlocked ? "Completed!" : `${progress}%`}
                    </span>
                    <span className={cn(
                      "font-semibold",
                      isUnlocked ? "text-white" : "text-foreground"
                    )}>
                      {streak.points}/{course.requiredPoints}
                    </span>
                  </div>
                  
                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                      className={cn(
                        "h-full rounded-full",
                        isUnlocked 
                          ? cn("bg-gradient-to-r", course.unlockedGradient)
                          : "bg-gradient-to-r from-orange-500 to-amber-500"
                      )}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* How to earn points */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl p-5 border border-orange-200/50 dark:border-orange-800/30"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-bold text-sm">How to Earn Points</h3>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { icon: BookOpen, text: "Complete quizzes", points: "+5-15 pts" },
            { icon: Target, text: "Score 80%+ on quiz", points: "+10 bonus" },
            { icon: Star, text: "Explore new pages", points: "+1 pt/page" },
            { icon: Zap, text: "Every 5 pages visited", points: "+5 bonus" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <item.icon className="h-4 w-4 text-orange-500" />
              <span className="text-muted-foreground flex-1">{item.text}</span>
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">{item.points}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
