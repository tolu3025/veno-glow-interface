import React from "react";
import { useStreak } from "@/providers/StreakProvider";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { Flame, X, Check } from "lucide-react";

export function StreakCalendar() {
  const { streak } = useStreak();
  const today = new Date();
  const dayElements = [];

  // Generate last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const dateString = format(date, "yyyy-MM-dd");
    const isActive = date <= today && streak.lastActivity === dateString;
    const isInactive = streak.inactiveDays && streak.inactiveDays.includes(dateString);
    const isToday = format(today, "yyyy-MM-dd") === dateString;
    const isPast = date < today;
    
    let status = "inactive";
    
    if (isActive) {
      status = "active";
    } else if (isInactive) {
      status = "missed";
    }
    
    if (isToday) {
      status = streak.lastActivity === dateString ? "today-active" : "today";
    }
    
    dayElements.push(
      <motion.div 
        key={dateString} 
        className="relative group"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: (29 - i) * 0.015 }}
      >
        <div 
          className={cn(
            "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-medium transition-all relative overflow-hidden",
            status === "active" && "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md shadow-green-500/30",
            status === "missed" && "bg-gradient-to-br from-red-400 to-rose-500 text-white shadow-md shadow-red-500/30",
            status === "inactive" && isPast && "bg-muted/30 text-muted-foreground",
            status === "today" && "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/40 ring-2 ring-orange-400 ring-offset-1 ring-offset-background",
            status === "today-active" && "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md shadow-green-500/40 ring-2 ring-green-400 ring-offset-1 ring-offset-background",
            !isPast && status !== "today" && status !== "today-active" && "bg-background text-muted-foreground border border-dashed border-muted-foreground/30"
          )}
        >
          {/* Icon indicator */}
          {status === "active" || status === "today-active" ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 drop-shadow-sm" />
            </motion.div>
          ) : status === "missed" ? (
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
          ) : status === "today" ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            </motion.div>
          ) : (
            format(date, "d")
          )}
        </div>
        
        {/* Tooltip - hidden on mobile */}
        <div className="absolute hidden md:group-hover:flex flex-col items-center bg-slate-900 text-white px-2 py-1.5 rounded-lg text-xs bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 shadow-xl">
          <span className="font-medium">{format(date, "MMM d, yyyy")}</span>
          {status === "active" || status === "today-active" ? (
            <span className="text-green-400 flex items-center gap-1">
              <Check className="h-3 w-3" /> Quiz Completed
            </span>
          ) : status === "missed" ? (
            <span className="text-red-400">Streak Lost</span>
          ) : status === "today" ? (
            <span className="text-orange-400">Complete a quiz!</span>
          ) : null}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      </motion.div>
    );
  }
  
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 justify-items-center mb-1 sm:mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={`weekday-${i}`} className="text-[10px] sm:text-xs font-semibold text-muted-foreground w-7 sm:w-8 md:w-9 text-center">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 justify-items-center">
        {dayElements}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-sm sm:rounded-md bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
            <Flame className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground">Active</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-sm sm:rounded-md bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
            <X className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground">Missed</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-sm sm:rounded-md bg-gradient-to-br from-amber-400 to-orange-500 ring-1 ring-orange-400 ring-offset-1 ring-offset-background" />
          <span className="text-[10px] sm:text-xs text-muted-foreground">Today</span>
        </div>
      </div>
    </div>
  );
}
