
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Award, Check } from "lucide-react";
import { useStreak } from "@/providers/StreakProvider";
import { Checkbox } from "@/components/ui/checkbox";

export function StreakMilestoneDialog() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { streak } = useStreak();
  
  // Milestone thresholds - show celebrations at these streak counts
  const milestones = [5, 10, 30, 60, 100, 365];
  
  useEffect(() => {
    // Find the current milestone if any
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
  
  // Skip rendering if no milestone or already dismissed
  if (!milestones.includes(streak.currentStreak)) {
    return null;
  }
  
  // Define milestone specific content
  const getMilestoneContent = () => {
    switch (streak.currentStreak) {
      case 5:
        return {
          title: "5-Day Streak Achieved!",
          description: "You've been consistent for 5 days. Great work!",
          icon: <Flame className="h-12 w-12 text-amber-500" />
        };
      case 10:
        return {
          title: "10-Day Streak Milestone!",
          description: "Double digits! Your commitment is impressive.",
          icon: <Flame className="h-12 w-12 text-orange-500" />
        };
      case 30:
        return {
          title: "30 Days of Success!",
          description: "A full month of consistency. You're building excellent habits!",
          icon: <Award className="h-12 w-12 text-primary" />
        };
      case 60:
        return {
          title: "60-Day Streak Champion!",
          description: "Two months of dedication. You're among our most committed users!",
          icon: <Award className="h-12 w-12 text-primary" />
        };
      case 100:
        return {
          title: "Century Milestone!",
          description: "100 days! What an incredible achievement.",
          icon: <Award className="h-12 w-12 text-yellow-500" />
        };
      case 365:
        return {
          title: "One Year Strong!",
          description: "A full year of daily progress. You're truly exceptional!",
          icon: <Award className="h-12 w-12 text-yellow-500" />
        };
      default:
        return {
          title: `${streak.currentStreak}-Day Streak!`,
          description: "Keep up the great work!",
          icon: <Flame className="h-12 w-12 text-amber-500" />
        };
    }
  };
  
  const milestoneContent = getMilestoneContent();
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {milestoneContent.title}
          </DialogTitle>
          <DialogDescription>
            {milestoneContent.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-6">
          <div className="bg-amber-50 dark:bg-amber-950/30 p-8 rounded-full mb-4">
            {milestoneContent.icon}
          </div>
          
          <p className="text-center text-lg font-medium mb-2">
            🔥 {streak.currentStreak} Day Streak!
          </p>
          <p className="text-center text-sm text-muted-foreground">
            You've earned {streak.points} total points
          </p>
        </div>
        
        <div className="flex items-center space-x-2 py-2">
          <Checkbox 
            id="dontShowMilestone" 
            checked={dontShowAgain} 
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <label
            htmlFor="dontShowMilestone"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Don't show milestone celebrations
          </label>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose}>
            Dismiss
          </Button>
          <Button onClick={handleClose} className="flex items-center gap-1">
            <Check className="h-4 w-4" />
            Awesome!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
