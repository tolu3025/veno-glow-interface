import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Award, Check, Star, Sparkles } from "lucide-react";
import { useStreak } from "@/providers/StreakProvider";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function StreakMilestoneDialog() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { streak } = useStreak();
  
  // Milestone thresholds - show celebrations at these streak counts
  const milestones = [5, 10, 30, 60, 100, 365];
  
  useEffect(() => {
    const currentMilestone = milestones.find(m => streak.currentStreak === m);
    
    if (currentMilestone) {
      const milestoneKey = `streak-milestone-${currentMilestone}-dismissed`;
      const hasBeenShown = localStorage.getItem(milestoneKey);
      
      if (!hasBeenShown) {
        const timer = setTimeout(() => {
          setOpen(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [streak.currentStreak]);
  
  const handleClose = () => {
    const currentMilestone = milestones.find(m => streak.currentStreak === m);
    
    if (currentMilestone && dontShowAgain) {
      localStorage.setItem(`streak-milestone-${currentMilestone}-dismissed`, 'true');
    }
    setOpen(false);
  };
  
  if (!milestones.includes(streak.currentStreak)) {
    return null;
  }
  
  // Define milestone specific content with Snapchat-style theming
  const getMilestoneContent = () => {
    switch (streak.currentStreak) {
      case 5:
        return {
          title: "First Milestone!",
          subtitle: "5-Day Streak",
          description: "You're building a habit! Keep the fire burning!",
          gradient: "from-orange-500 to-amber-500",
          emoji: "🔥",
          tier: "Rising Star"
        };
      case 10:
        return {
          title: "Double Digits!",
          subtitle: "10-Day Streak",
          description: "You're on fire! Your consistency is paying off!",
          gradient: "from-orange-600 to-red-500",
          emoji: "⚡",
          tier: "Dedicated Learner"
        };
      case 30:
        return {
          title: "One Month Strong!",
          subtitle: "30-Day Streak",
          description: "A full month of learning! You're unstoppable!",
          gradient: "from-blue-500 via-cyan-500 to-teal-500",
          emoji: "💎",
          tier: "Epic Scholar"
        };
      case 60:
        return {
          title: "Two Month Champion!",
          subtitle: "60-Day Streak",
          description: "Your dedication is legendary! Keep pushing!",
          gradient: "from-purple-500 via-pink-500 to-rose-500",
          emoji: "👑",
          tier: "Streak Champion"
        };
      case 100:
        return {
          title: "Century Club!",
          subtitle: "100-Day Streak",
          description: "100 days of excellence! You're in the top 1%!",
          gradient: "from-amber-400 via-yellow-500 to-orange-500",
          emoji: "🏆",
          tier: "Centurion"
        };
      case 365:
        return {
          title: "Legendary Year!",
          subtitle: "365-Day Streak",
          description: "One full year! You've achieved greatness!",
          gradient: "from-purple-600 via-pink-600 to-red-600",
          emoji: "🌟",
          tier: "Legend"
        };
      default:
        return {
          title: "Milestone Reached!",
          subtitle: `${streak.currentStreak}-Day Streak`,
          description: "Keep up the amazing work!",
          gradient: "from-orange-500 to-amber-500",
          emoji: "🔥",
          tier: "Achiever"
        };
    }
  };
  
  const content = getMilestoneContent();
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className={cn(
            "relative rounded-2xl overflow-hidden",
            "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          )}
        >
          {/* Animated gradient background */}
          <motion.div
            animate={{ 
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className={cn(
              "absolute inset-0 opacity-30",
              "bg-gradient-to-r", content.gradient,
              "bg-[length:200%_200%]"
            )}
          />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: "100%",
                  opacity: 0 
                }}
                animate={{ 
                  y: "-20%",
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute"
              >
                <Sparkles className="h-4 w-4 text-yellow-400/50" />
              </motion.div>
            ))}
          </div>
          
          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                {content.emoji}
              </motion.div>
              <h2 className={cn(
                "text-2xl font-black bg-gradient-to-r bg-clip-text text-transparent mb-1",
                content.gradient
              )}>
                {content.title}
              </h2>
              <p className="text-white/80 font-semibold">{content.subtitle}</p>
            </div>
            
            {/* Main streak display */}
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 30px rgba(251,146,60,0.4)",
                  "0 0 60px rgba(251,146,60,0.6)",
                  "0 0 30px rgba(251,146,60,0.4)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "relative w-32 h-32 mx-auto mb-6 rounded-full",
                "bg-gradient-to-br", content.gradient
              )}
            >
              <div className="absolute inset-2 rounded-full bg-slate-900/90 flex flex-col items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Flame className="h-8 w-8 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                </motion.div>
                <span className="text-4xl font-black text-white">{streak.currentStreak}</span>
                <span className="text-[10px] text-white/60 uppercase tracking-wider">Days</span>
              </div>
            </motion.div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{streak.points}</div>
                <div className="text-[10px] text-white/50 uppercase">Total Points</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Award className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{content.tier}</div>
                <div className="text-[10px] text-white/50 uppercase">Your Rank</div>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-center text-white/70 text-sm mb-6">
              {content.description}
            </p>
            
            {/* Don't show again */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Checkbox 
                id="dontShowMilestone" 
                checked={dontShowAgain} 
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                className="border-white/30"
              />
              <label
                htmlFor="dontShowMilestone"
                className="text-xs text-white/50 cursor-pointer"
              >
                Don't show milestone celebrations
              </label>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={handleClose}
                className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
              >
                Dismiss
              </Button>
              <Button 
                onClick={handleClose} 
                className={cn(
                  "flex-1 bg-gradient-to-r text-white font-semibold",
                  content.gradient,
                  "hover:opacity-90"
                )}
              >
                <Check className="h-4 w-4 mr-2" />
                Amazing!
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
