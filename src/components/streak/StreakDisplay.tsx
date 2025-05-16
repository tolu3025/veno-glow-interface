
import { useStreak } from "@/providers/StreakProvider";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  variant?: "compact" | "full";
  className?: string;
}

export function StreakDisplay({ variant = "compact", className }: StreakDisplayProps) {
  const { streak, getStreakMessage } = useStreak();
  
  if (variant === "compact") {
    return (
      <div className={cn("hidden md:flex items-center gap-1", className)}>
        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 px-2 py-0">
          <Flame className="h-3.5 w-3.5 mr-1 text-orange-500" />
          <span>{streak.currentStreak}</span>
        </Badge>
        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 px-2 py-0">
          <Trophy className="h-3.5 w-3.5 mr-1 text-blue-500" />
          <span>{streak.points}</span>
        </Badge>
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none px-2 py-0.5">
          <Flame className="h-4 w-4 mr-1" />
          <span>{streak.currentStreak} day streak</span>
        </Badge>
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-none px-2 py-0.5">
          <Trophy className="h-4 w-4 mr-1" />
          <span>{streak.points} points</span>
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{getStreakMessage()}</p>
    </div>
  );
}
