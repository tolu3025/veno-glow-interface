import React from "react";
import { useStreak } from "@/providers/StreakProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronRight, Calendar, Trophy, Flame, Award, Star, Target, Zap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { StreakCalendar } from "@/components/streak/StreakCalendar";
import { StreakAchievements } from "@/components/streak/StreakAchievements";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const StreakAnalyticsPage = () => {
  const { streak, getStreakMessage } = useStreak();
  const navigate = useNavigate();
  
  const today = new Date().toISOString().split('T')[0];
  const hasQuizToday = streak.lastActivity === today;
  
  // Calculate percentage to next unlock
  const nextCertLevel = [50, 100, 200, 500, 1000].find(level => level > streak.points) || 1000;
  const prevCertLevel = [0, 50, 100, 200, 500].find((_, i, arr) => arr[i + 1] > streak.points) || 0;
  const progressPercentage = ((streak.points - prevCertLevel) / (nextCertLevel - prevCertLevel)) * 100;

  // Streak tier calculation
  const getStreakTier = () => {
    if (streak.currentStreak >= 30) return { tier: "Legendary", color: "from-purple-500 via-pink-500 to-red-500", emoji: "👑" };
    if (streak.currentStreak >= 14) return { tier: "Epic", color: "from-blue-500 via-cyan-400 to-teal-500", emoji: "💎" };
    if (streak.currentStreak >= 7) return { tier: "Rare", color: "from-orange-500 via-amber-500 to-yellow-500", emoji: "⚡" };
    if (streak.currentStreak >= 3) return { tier: "Common", color: "from-orange-600 to-red-500", emoji: "🔥" };
    return { tier: "Starter", color: "from-orange-400 to-orange-600", emoji: "✨" };
  };
  
  const tierInfo = getStreakTier();

  // Next milestone information
  const nextMilestone = {
    points: nextCertLevel,
    name: nextCertLevel === 50 ? "Basic Certification" :
          nextCertLevel === 100 ? "Intermediate Certification" :
          nextCertLevel === 200 ? "Advanced Certification" :
          nextCertLevel === 500 ? "Expert Certification" : "Master Certification"
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container py-6 max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Streak Analytics
            </h1>
            <p className="text-muted-foreground mt-1">Track your learning progress and achievements</p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4 md:mt-0">
            <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
            Back
          </Button>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2"
        >
          {/* Main Streak Card - Snapchat Style */}
          <motion.div variants={itemVariants} className="col-span-2">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              {/* Animated background glow */}
              <div className={cn(
                "absolute inset-0 opacity-20",
                "bg-gradient-to-r", tierInfo.color,
                "blur-3xl"
              )} />
              
              <CardContent className="relative p-8">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {/* Main Streak Circle */}
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        "0 0 30px rgba(251,146,60,0.3)",
                        "0 0 60px rgba(251,146,60,0.5)",
                        "0 0 30px rgba(251,146,60,0.3)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn(
                      "relative flex flex-col items-center justify-center",
                      "w-40 h-40 rounded-full",
                      "bg-gradient-to-br", tierInfo.color
                    )}
                  >
                    <div className="absolute inset-2 rounded-full bg-slate-900/90 flex flex-col items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Flame className="h-10 w-10 text-orange-500 mb-1 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                      </motion.div>
                      <span className="text-5xl font-black text-white tabular-nums">
                        {streak.currentStreak}
                      </span>
                      <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">
                        Day Streak
                      </span>
                    </div>
                    
                    {/* Progress ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="50%" cy="50%" r="47%" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                      <motion.circle
                        cx="50%"
                        cy="50%"
                        r="47%"
                        fill="none"
                        stroke="url(#analyticsGradient)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min((streak.currentStreak / 30) * 100, 100) * 2.95} 300`}
                        initial={{ strokeDashoffset: 300 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="analyticsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="50%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </motion.div>
                  
                  {/* Stats and Info */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                      <span className="text-2xl">{tierInfo.emoji}</span>
                      <span className={cn(
                        "font-bold text-xl bg-gradient-to-r bg-clip-text text-transparent",
                        tierInfo.color
                      )}>
                        {tierInfo.tier} Tier
                      </span>
                    </div>
                    
                    <p className="text-white/80 text-lg mb-4">{getStreakMessage()}</p>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                        <div className="text-xl font-bold text-white">{streak.points}</div>
                        <div className="text-[10px] text-white/50 uppercase">Points</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <BookOpen className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                        <div className="text-xl font-bold text-white">{streak.completedQuizzes.size}</div>
                        <div className="text-[10px] text-white/50 uppercase">Quizzes</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <Award className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                        <div className="text-xl font-bold text-white">{streak.unlockedCourses.size}</div>
                        <div className="text-[10px] text-white/50 uppercase">Badges</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <Target className="h-5 w-5 text-green-400 mx-auto mb-1" />
                        <div className="text-xl font-bold text-white">{streak.visitedPages.size}</div>
                        <div className="text-[10px] text-white/50 uppercase">Pages</div>
                      </div>
                    </div>
                    
                    {/* Today's Status */}
                    <div className={cn(
                      "mt-4 p-3 rounded-xl text-center",
                      hasQuizToday 
                        ? "bg-green-500/20 border border-green-500/30" 
                        : "bg-orange-500/20 border border-orange-500/30"
                    )}>
                      {hasQuizToday ? (
                        <p className="text-green-400 font-medium flex items-center justify-center gap-2">
                          <Zap className="h-4 w-4" />
                          You've kept your streak alive today!
                        </p>
                      ) : (
                        <p className="text-orange-400 font-medium flex items-center justify-center gap-2">
                          <Flame className="h-4 w-4" />
                          Complete a quiz to save your streak!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Calendar Card */}
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                  </div>
                  Streak Calendar
                </CardTitle>
                <CardDescription>Your activity in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <StreakCalendar />
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Next Milestone Card */}
          <motion.div variants={itemVariants}>
            <Card className="h-full overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Trophy className="h-5 w-5 text-amber-500" />
                  </div>
                  Next Milestone
                </CardTitle>
                <CardDescription>
                  {nextMilestone.points - streak.points} points to {nextMilestone.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Custom Progress Bar */}
                  <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-foreground/80">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{streak.points} pts</span>
                    <span className="font-semibold text-amber-500">{nextMilestone.points} pts</span>
                  </div>
                  
                  {/* Milestone Preview */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-4 text-center">
                    <Award className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-semibold text-sm">{nextMilestone.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Unlocks at {nextMilestone.points} points
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" 
                    onClick={() => navigate('/cbt')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Take a Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Achievements Card */}
          <motion.div variants={itemVariants} className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Award className="h-5 w-5 text-purple-500" />
                  </div>
                  Your Achievements
                </CardTitle>
                <CardDescription>Certifications and milestones you've earned</CardDescription>
              </CardHeader>
              <CardContent>
                <StreakAchievements />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default StreakAnalyticsPage;
