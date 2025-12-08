import React, { useEffect, useState } from "react";
import { useStreak } from "@/providers/StreakProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronRight, Calendar, Trophy, Flame, Award, Star, Target, Zap, BookOpen, ArrowLeft, Swords, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { StreakCalendar } from "@/components/streak/StreakCalendar";
import { StreakAchievements } from "@/components/streak/StreakAchievements";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface ChallengeStats {
  current_streak: number;
  highest_streak: number;
  total_wins: number;
  total_challenges: number;
}

const StreakAnalyticsPage = () => {
  const { streak, getStreakMessage } = useStreak();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challengeStats, setChallengeStats] = useState<ChallengeStats | null>(null);
  
  useEffect(() => {
    if (user) {
      supabase.from('user_challenge_stats').select('*').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data) setChallengeStats(data);
        });
    }
  }, [user]);
  
  const today = new Date().toISOString().split('T')[0];
  const hasQuizToday = streak.lastActivity === today;
  
  // Calculate percentage to next unlock
  const nextCertLevel = [50, 100, 200, 500, 1000].find(level => level > streak.points) || 1000;
  const prevCertLevel = [0, 50, 100, 200, 500].find((_, i, arr) => arr[i + 1] > streak.points) || 0;
  const progressPercentage = ((streak.points - prevCertLevel) / (nextCertLevel - prevCertLevel)) * 100;

  // Challenge Streak tier calculation (based on challenge wins)
  const getStreakTier = () => {
    const challengeStreak = challengeStats?.current_streak || 0;
    if (challengeStreak >= 30) return { tier: "Legendary", color: "from-purple-500 via-pink-500 to-red-500", emoji: "👑" };
    if (challengeStreak >= 14) return { tier: "Epic", color: "from-blue-500 via-cyan-400 to-teal-500", emoji: "💎" };
    if (challengeStreak >= 7) return { tier: "Rare", color: "from-orange-500 via-amber-500 to-yellow-500", emoji: "⚡" };
    if (challengeStreak >= 3) return { tier: "Common", color: "from-orange-600 to-red-500", emoji: "🔥" };
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
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-bold">Streak Analytics</span>
          </div>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>
      
      <div className="container py-4 sm:py-6 px-3 sm:px-4 max-w-4xl">
        {/* Desktop Header - hidden on mobile */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Streak Analytics
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Track your learning progress and achievements</p>
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
          className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2"
        >
          {/* Main Streak Card - Snapchat Style */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              {/* Animated background glow */}
              <div className={cn(
                "absolute inset-0 opacity-20",
                "bg-gradient-to-r", tierInfo.color,
                "blur-3xl"
              )} />
              
              <CardContent className="relative p-4 sm:p-6 md:p-8">
                <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8 lg:flex-row">
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
                      "relative flex flex-col items-center justify-center shrink-0",
                      "w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full",
                      "bg-gradient-to-br", tierInfo.color
                    )}
                  >
                    <div className="absolute inset-1.5 sm:inset-2 rounded-full bg-slate-900/90 flex flex-col items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Flame className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-orange-500 mb-0.5 sm:mb-1 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                      </motion.div>
                      <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tabular-nums">
                        {challengeStats?.current_streak || 0}
                      </span>
                      <span className="text-[10px] sm:text-xs text-white/60 font-semibold uppercase tracking-wider">
                        Win Streak
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
                        strokeDasharray={`${Math.min(((challengeStats?.current_streak || 0) / 30) * 100, 100) * 2.95} 300`}
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
                  <div className="flex-1 text-center lg:text-left w-full">
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 sm:mb-3">
                      <span className="text-xl sm:text-2xl">{tierInfo.emoji}</span>
                      <span className={cn(
                        "font-bold text-lg sm:text-xl bg-gradient-to-r bg-clip-text text-transparent",
                        tierInfo.color
                      )}>
                        {tierInfo.tier} Tier
                      </span>
                    </div>
                    
                    <p className="text-white/80 text-sm sm:text-base md:text-lg mb-3 sm:mb-4">{getStreakMessage()}</p>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                      <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                        <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mx-auto mb-0.5 sm:mb-1" />
                        <div className="text-base sm:text-lg md:text-xl font-bold text-white">{challengeStats?.total_wins || 0}</div>
                        <div className="text-[8px] sm:text-[10px] text-white/50 uppercase">Wins</div>
                      </div>
                      <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                        <Swords className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mx-auto mb-0.5 sm:mb-1" />
                        <div className="text-base sm:text-lg md:text-xl font-bold text-white">{challengeStats?.total_challenges || 0}</div>
                        <div className="text-[8px] sm:text-[10px] text-white/50 uppercase">Battles</div>
                      </div>
                      <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 mx-auto mb-0.5 sm:mb-1" />
                        <div className="text-base sm:text-lg md:text-xl font-bold text-white">{challengeStats?.highest_streak || 0}</div>
                        <div className="text-[8px] sm:text-[10px] text-white/50 uppercase">Best</div>
                      </div>
                      <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mx-auto mb-0.5 sm:mb-1" />
                        <div className="text-base sm:text-lg md:text-xl font-bold text-white">
                          {challengeStats?.total_challenges ? Math.round((challengeStats.total_wins / challengeStats.total_challenges) * 100) : 0}%
                        </div>
                        <div className="text-[8px] sm:text-[10px] text-white/50 uppercase">Win Rate</div>
                      </div>
                    </div>
                    
                    {/* Challenge CTA */}
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg sm:rounded-xl text-center bg-veno-primary/20 border border-veno-primary/30">
                      <Button 
                        onClick={() => navigate('/cbt/streak-challenge')}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                      >
                        <Swords className="h-4 w-4 mr-2" />
                        Start a Challenge
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Calendar Card */}
          <motion.div variants={itemVariants} className="col-span-1">
            <Card className="h-full">
              <CardHeader className="p-4 sm:p-6">
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
          <motion.div variants={itemVariants} className="col-span-1">
            <Card className="h-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  </div>
                  Challenge Stats
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your PvP battle performance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {/* Win Rate Progress */}
                  <div className="relative h-3 sm:h-4 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${challengeStats?.total_challenges ? Math.round((challengeStats.total_wins / challengeStats.total_challenges) * 100) : 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-veno-primary to-emerald-500 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] sm:text-xs font-bold text-foreground/80">
                        {challengeStats?.total_challenges ? Math.round((challengeStats.total_wins / challengeStats.total_challenges) * 100) : 0}% Win Rate
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">{challengeStats?.total_wins || 0} wins</span>
                    <span className="font-semibold text-veno-primary">{challengeStats?.total_challenges || 0} battles</span>
                  </div>
                  
                  {/* Best Streak Preview */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                    <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mx-auto mb-1.5 sm:mb-2" />
                    <p className="font-semibold text-xs sm:text-sm">Best Win Streak: {challengeStats?.highest_streak || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      Keep winning to beat your record!
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm" 
                    onClick={() => navigate('/cbt/streak-challenge')}
                  >
                    <Swords className="h-4 w-4 mr-2" />
                    Challenge Someone
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Achievements Card */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  </div>
                  Your Achievements
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Certifications and milestones you've earned</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
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
