
import React from "react";
import { useStreak } from "@/providers/StreakProvider";
import { cn } from "@/lib/utils";
import { format, addDays, subDays } from "date-fns";

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
    
    // Default to inactive for past days
    let status = "inactive";
    
    // Check if this date is the streak's last activity
    if (isActive) {
      status = "active";
    } 
    // Mark as missed day
    else if (isInactive) {
      status = "missed";
    }
    
    // Is this today?
    if (isToday) {
      status = streak.lastActivity === dateString ? "today-active" : "today";
    }
    
    dayElements.push(
      <div key={dateString} className="relative group">
        <div 
          className={cn(
            "h-8 w-8 rounded-md flex items-center justify-center text-xs transition-all",
            status === "active" && "bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-400",
            status === "missed" && "bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-400",
            status === "inactive" && isPast && "bg-muted/20 text-muted-foreground",
            status === "today" && "bg-amber-100 dark:bg-amber-800/30 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500 ring-offset-1 ring-offset-background",
            status === "today-active" && "bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-400 ring-2 ring-green-500 ring-offset-1 ring-offset-background",
            !isPast && "bg-background text-muted-foreground"
          )}
        >
          {format(date, "d")}
        </div>
        <div className="absolute hidden group-hover:block bg-black text-white p-1 rounded text-xs bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
          {format(date, "MMM d, yyyy")}
          {isActive && <span className="ml-1">(active)</span>}
          {isInactive && <span className="ml-1 text-red-300">(missed)</span>}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1 justify-items-center">
        {dayElements.slice(0, 7).map((day, i) => (
          <div key={`weekday-${i}`} className="text-xs text-center text-muted-foreground w-8">
            {format(addDays(subDays(today, 29), i), "EEEEE")}
          </div>
        ))}
        {dayElements}
      </div>
      
      <div className="flex flex-wrap justify-around gap-2 pt-3 text-xs text-center">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-green-100 dark:bg-green-800/30 rounded"></div>
          <span className="text-muted-foreground">Active day</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-red-100 dark:bg-red-800/30 rounded"></div>
          <span className="text-muted-foreground">Missed day</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-amber-100 dark:bg-amber-800/30 rounded"></div>
          <span className="text-muted-foreground">Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-muted/20 rounded"></div>
          <span className="text-muted-foreground">Inactive day</span>
        </div>
      </div>
    </div>
  );
}
