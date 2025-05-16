
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Flame, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useStreak } from "@/providers/StreakProvider";
import { useNavigate } from "react-router-dom";

export function StreakMissedDialog() {
  const [open, setOpen] = useState(false);
  const { streak } = useStreak();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If there's a last activity and it's not today or yesterday
    if (streak.lastActivity) {
      const today = new Date();
      const lastActivity = new Date(streak.lastActivity);
      const daysSinceLastActivity = differenceInDays(today, lastActivity);
      
      // Only show dialog if more than 1 day has passed (streak broken)
      if (daysSinceLastActivity > 1 && streak.currentStreak < 2) {
        // Add a small delay to show the dialog after the page loads
        const timer = setTimeout(() => {
          setOpen(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [streak.lastActivity, streak.currentStreak]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" /> 
            Your streak was reset!
          </DialogTitle>
          <DialogDescription>
            You missed some days and your streak has been reset to 1.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-full mb-4">
            <Flame className="h-12 w-12 text-amber-500" />
          </div>
          
          <p className="text-center mb-4">
            Your last visit was on <span className="font-medium">{format(new Date(streak.lastActivity || new Date()), 'MMMM d, yyyy')}</span>.
            Keep visiting daily to build your streak again!
          </p>
          
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Your current streak: <span className="font-bold">{streak.currentStreak}</span> day(s)</span>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Dismiss
          </Button>
          <Button onClick={() => {
            navigate('/streak-analytics');
            setOpen(false);
          }}>
            View Streak Analytics
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
