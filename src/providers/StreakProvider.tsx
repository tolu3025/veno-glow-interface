
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";

interface StreakState {
  currentStreak: number;
  lastActivity: string | null;
  points: number;
  visitedPages: Set<string>;
  watchedVideos: Set<string>;
}

interface StreakContextType {
  streak: StreakState;
  addPageVisit: (page: string) => void;
  addVideoWatch: (videoId: string, points?: number) => void;
  getStreakMessage: () => string;
}

const DEFAULT_STREAK_STATE: StreakState = {
  currentStreak: 0,
  lastActivity: null,
  points: 0,
  visitedPages: new Set(),
  watchedVideos: new Set(),
};

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakState>(() => {
    const savedStreak = localStorage.getItem("veno-streak");
    if (savedStreak) {
      const parsed = JSON.parse(savedStreak);
      return {
        ...parsed,
        visitedPages: new Set(parsed.visitedPages || []),
        watchedVideos: new Set(parsed.watchedVideos || []),
      };
    }
    return DEFAULT_STREAK_STATE;
  });

  // Save streak to localStorage whenever it changes
  useEffect(() => {
    const serializedStreak = {
      ...streak,
      visitedPages: Array.from(streak.visitedPages),
      watchedVideos: Array.from(streak.watchedVideos),
    };
    localStorage.setItem("veno-streak", JSON.stringify(serializedStreak));
  }, [streak]);

  // Check if user is active today
  useEffect(() => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    if (streak.lastActivity !== today) {
      if (isConsecutiveDay(streak.lastActivity)) {
        setStreak(prev => ({
          ...prev,
          currentStreak: prev.currentStreak + 1,
          lastActivity: today,
        }));
        
        if (streak.currentStreak + 1 >= 1) {
          toast.success(`🔥 Day ${streak.currentStreak + 1} streak! Keep it up!`);
        }
      } else if (streak.lastActivity) {
        // User broke their streak
        setStreak(prev => ({
          ...prev,
          currentStreak: 1,
          lastActivity: today,
        }));
        toast.info("Welcome back! You've started a new streak today.");
      } else {
        // First time user
        setStreak(prev => ({
          ...prev,
          currentStreak: 1,
          lastActivity: today,
        }));
        toast.success("🎉 You've started your first streak! Welcome to Veno!");
      }
    }
  }, [user]);

  // Check if the lastActivity date is the day before today
  const isConsecutiveDay = (lastActivityDate: string | null): boolean => {
    if (!lastActivityDate) return false;
    
    const today = new Date();
    const lastDate = new Date(lastActivityDate);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return lastDate.getDate() === yesterday.getDate() &&
           lastDate.getMonth() === yesterday.getMonth() &&
           lastDate.getFullYear() === yesterday.getFullYear();
  };

  const addPageVisit = (page: string) => {
    if (streak.visitedPages.has(page)) return;
    
    setStreak(prev => {
      const newPoints = prev.points + 1;
      const newVisitedPages = new Set(prev.visitedPages);
      newVisitedPages.add(page);
      
      if (newVisitedPages.size % 5 === 0) {
        toast.success(`🎯 You've explored ${newVisitedPages.size} pages! +5 bonus points!`);
        return {
          ...prev,
          points: newPoints + 5,
          visitedPages: newVisitedPages,
        };
      }
      
      return {
        ...prev,
        points: newPoints,
        visitedPages: newVisitedPages,
      };
    });
  };

  const addVideoWatch = (videoId: string, points = 10) => {
    if (streak.watchedVideos.has(videoId)) return;
    
    setStreak(prev => {
      const newWatchedVideos = new Set(prev.watchedVideos);
      newWatchedVideos.add(videoId);
      
      toast.success(`🎓 +${points} points for watching a tutorial!`);
      
      return {
        ...prev,
        points: prev.points + points,
        watchedVideos: newWatchedVideos,
      };
    });
  };

  const getStreakMessage = (): string => {
    if (streak.currentStreak >= 30) {
      return `🔥 ${streak.currentStreak} day streak! Master level!`;
    } else if (streak.currentStreak >= 14) {
      return `🔥 ${streak.currentStreak} day streak! Pro level!`;
    } else if (streak.currentStreak >= 7) {
      return `🔥 ${streak.currentStreak} day streak! Advanced level!`;
    } else if (streak.currentStreak >= 3) {
      return `🔥 ${streak.currentStreak} day streak! Keep going!`;
    } else if (streak.currentStreak > 0) {
      return `🔥 ${streak.currentStreak} day streak! Just getting started!`;
    }
    return "Start your streak today!";
  };

  return (
    <StreakContext.Provider 
      value={{ 
        streak, 
        addPageVisit, 
        addVideoWatch,
        getStreakMessage
      }}
    >
      {children}
    </StreakContext.Provider>
  );
}

export const useStreak = () => {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error("useStreak must be used within a StreakProvider");
  }
  return context;
};
