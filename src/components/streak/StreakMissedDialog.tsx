import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Flame, AlertTriangle, Zap, ArrowRight } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useStreak } from "@/providers/StreakProvider";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StreakMissedDialog() {
  const [open, setOpen] = useState(false);
  const { streak } = useStreak();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (streak.lastActivity) {
      const today = new Date();
      const lastActivity = new Date(streak.lastActivity);
      const daysSinceLastActivity = differenceInDays(today, lastActivity);
      
      // Only show dialog if more than 1 day has passed (streak broken)
      if (daysSinceLastActivity > 1 && streak.currentStreak < 2) {
        const timer = setTimeout(() => {
          setOpen(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [streak.lastActivity, streak.currentStreak]);
  
  const daysMissed = streak.lastActivity 
    ? differenceInDays(new Date(), new Date(streak.lastActivity)) - 1
    : 0;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        >
          {/* Red/orange warning glow */}
          <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 blur-3xl" />
          
          {/* Broken streak visual */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
          
          <div className="relative z-10 p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [-5, 5, -5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative"
              >
                <div className="p-5 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
                  <Flame className="h-12 w-12 text-orange-500/50" />
                </div>
                {/* Crack effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </motion.div>
              </motion.div>
            </div>
            
            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white mb-2">
                Streak Reset! 😢
              </h2>
              <p className="text-white/60 text-sm">
                You missed {daysMissed} day{daysMissed !== 1 ? 's' : ''} of learning
              </p>
            </div>
            
            {/* Last activity info */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-3 text-white/80">
                <Calendar className="h-5 w-5 text-amber-500" />
                <div className="text-sm">
                  <span className="text-white/50">Last active: </span>
                  <span className="font-semibold text-white">
                    {streak.lastActivity 
                      ? format(new Date(streak.lastActivity), 'MMMM d, yyyy')
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Flame className="h-5 w-5 text-orange-500/50 mx-auto mb-1" />
                <div className="text-xl font-bold text-white">{streak.currentStreak}</div>
                <div className="text-[10px] text-white/50 uppercase">New Streak</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Zap className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-white">{streak.points}</div>
                <div className="text-[10px] text-white/50 uppercase">Points Kept</div>
              </div>
            </div>
            
            {/* Encouraging message */}
            <div className="text-center mb-6 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <p className="text-green-400 text-sm font-medium">
                ✨ Your points are safe! Start a new streak today!
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
              >
                Dismiss
              </Button>
              <Button 
                onClick={() => {
                  navigate('/cbt');
                  setOpen(false);
                }}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:opacity-90"
              >
                Start Quiz
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
