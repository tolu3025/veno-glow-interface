import { useStreak } from "@/providers/StreakProvider";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Zap, Clock, BookOpen, Star } from "lucide-react";

interface StreakDisplayProps {
  variant?: "compact" | "full" | "card";
  className?: string;
}

export function StreakDisplay({ variant = "compact", className }: StreakDisplayProps) {
  const { streak, getStreakMessage } = useStreak();
  const navigate = useNavigate();
  
  const today = new Date().toISOString().split('T')[0];
  const hasQuizToday = streak.lastActivity === today;
  const isAtRisk = !hasQuizToday && streak.currentStreak > 0;
  
  // Determine streak tier for visual effects
  const getStreakTier = () => {
    if (streak.currentStreak >= 30) return { tier: "legendary", color: "from-purple-500 via-pink-500 to-red-500", glow: "shadow-purple-500/50" };
    if (streak.currentStreak >= 14) return { tier: "epic", color: "from-blue-500 via-cyan-400 to-teal-500", glow: "shadow-cyan-500/50" };
    if (streak.currentStreak >= 7) return { tier: "rare", color: "from-orange-500 via-amber-500 to-yellow-500", glow: "shadow-orange-500/50" };
    if (streak.currentStreak >= 3) return { tier: "common", color: "from-orange-600 to-red-500", glow: "shadow-orange-500/40" };
    return { tier: "starter", color: "from-orange-400 to-orange-600", glow: "shadow-orange-400/30" };
  };
  
  const tierInfo = getStreakTier();

  // Compact variant - for navbar
  if (variant === "compact") {
    return (
      <motion.div 
        className={cn("hidden md:flex items-center gap-2 cursor-pointer", className)}
        onClick={() => navigate("/streak-analytics")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Streak Fire */}
        <div className={cn(
          "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "bg-gradient-to-r", tierInfo.color,
          "shadow-lg", tierInfo.glow
        )}>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Flame className="h-4 w-4 text-white drop-shadow-[0_0_8px_rgba(255,200,0,0.8)]" />
          </motion.div>
          <span className="font-bold text-white text-sm tabular-nums">
            {streak.currentStreak}
          </span>
          
          {/* At risk indicator */}
          {isAtRisk && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background"
            >
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 bg-red-500 rounded-full"
              />
            </motion.div>
          )}
        </div>
        
        {/* Points */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg shadow-yellow-500/30">
          <Star className="h-3.5 w-3.5 text-white fill-white" />
          <span className="font-bold text-white text-sm tabular-nums">{streak.points}</span>
        </div>
      </motion.div>
    );
  }

  // Card variant - for dashboard/profile
  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl p-6",
          "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          "border border-white/10",
          className
        )}
        onClick={() => navigate("/streak-analytics")}
      >
        {/* Animated background glow */}
        <div className={cn(
          "absolute inset-0 opacity-30",
          "bg-gradient-to-r", tierInfo.color,
          "blur-3xl"
        )} />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [-3, 3, -3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "p-2 rounded-xl",
                  "bg-gradient-to-r", tierInfo.color
                )}
              >
                <Flame className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-white">Study Streak</h3>
                <p className="text-xs text-white/60">Keep learning daily!</p>
              </div>
            </div>
            
            {isAtRisk && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/50"
              >
                <Clock className="h-3 w-3 text-red-400" />
                <span className="text-xs font-medium text-red-400">At Risk!</span>
              </motion.div>
            )}
          </div>
          
          {/* Main Streak Display */}
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(251,146,60,0.3)",
                  "0 0 40px rgba(251,146,60,0.5)",
                  "0 0 20px rgba(251,146,60,0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "w-32 h-32 rounded-full",
                "bg-gradient-to-br", tierInfo.color
              )}
            >
              {/* Inner circle */}
              <div className="absolute inset-2 rounded-full bg-slate-900/90 flex flex-col items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Flame className="h-8 w-8 text-orange-500 mb-1 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
                </motion.div>
                <span className="text-4xl font-black text-white tabular-nums">
                  {streak.currentStreak}
                </span>
                <span className="text-xs text-white/60 font-medium">DAYS</span>
              </div>
              
              {/* Animated ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="url(#streakGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min((streak.currentStreak / 30) * 100, 100) * 3} 300`}
                  initial={{ strokeDashoffset: 300 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="streakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex flex-col items-center p-3 rounded-xl bg-white/5">
              <Star className="h-4 w-4 text-yellow-500 mb-1" />
              <span className="text-lg font-bold text-white">{streak.points}</span>
              <span className="text-[10px] text-white/50 uppercase">Points</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-white/5">
              <BookOpen className="h-4 w-4 text-blue-400 mb-1" />
              <span className="text-lg font-bold text-white">{streak.completedQuizzes.size}</span>
              <span className="text-[10px] text-white/50 uppercase">Quizzes</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-white/5">
              <Trophy className="h-4 w-4 text-amber-400 mb-1" />
              <span className="text-lg font-bold text-white capitalize">{tierInfo.tier}</span>
              <span className="text-[10px] text-white/50 uppercase">Tier</span>
            </div>
          </div>
          
          {/* Motivational Message */}
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-sm text-white/80">{getStreakMessage()}</p>
            {isAtRisk && (
              <p className="text-xs text-orange-400 mt-1">
                Complete a quiz today to keep your streak alive!
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Full variant - for inline display
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex flex-col space-y-3", className)}
    >
      <div className="flex items-center gap-3">
        {/* Streak Badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer",
            "bg-gradient-to-r", tierInfo.color,
            "shadow-lg", tierInfo.glow
          )}
          onClick={() => navigate("/streak-analytics")}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, 0]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame className="h-5 w-5 text-white drop-shadow-[0_0_8px_rgba(255,200,0,0.8)]" />
          </motion.div>
          <span className="font-bold text-white">
            {streak.currentStreak} day streak
          </span>
          
          {isAtRisk && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="ml-1"
            >
              <Zap className="h-4 w-4 text-yellow-200" />
            </motion.div>
          )}
        </motion.div>
        
        {/* Points Badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg shadow-yellow-500/30 cursor-pointer"
          onClick={() => navigate("/streak-analytics")}
        >
          <Star className="h-5 w-5 text-white fill-white" />
          <span className="font-bold text-white">{streak.points} points</span>
        </motion.div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">{getStreakMessage()}</p>
        {isAtRisk && (
          <motion.span
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-orange-500 font-medium text-xs"
          >
            Quiz today to save streak!
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
