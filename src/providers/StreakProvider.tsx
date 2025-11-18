
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface StreakState {
  currentStreak: number;
  lastActivity: string | null;
  points: number;
  visitedPages: Set<string>;
  watchedVideos: Set<string>;
  unlockedCourses: Set<string>;
  inactiveDays: string[];
  completedQuizzes: Set<string>; // Track completed quiz IDs
}

interface StreakContextType {
  streak: StreakState;
  addPageVisit: (page: string) => void;
  addVideoWatch: (videoId: string, points?: number) => void;
  addQuizCompletion: (quizId: string, score: number) => void; // New method
  getStreakMessage: () => string;
  isCourseUnlocked: (courseId: string) => boolean;
}

const DEFAULT_STREAK_STATE: StreakState = {
  currentStreak: 0,
  lastActivity: null,
  points: 0,
  visitedPages: new Set(),
  watchedVideos: new Set(),
  unlockedCourses: new Set(["intro-course"]),
  inactiveDays: [],
  completedQuizzes: new Set(),
};

// Certification courses that can be unlocked with streak points
const CERTIFICATION_COURSES = {
  "basic-certification": { name: "Basic Certification", requiredPoints: 50 },
  "intermediate-certification": { name: "Intermediate Certification", requiredPoints: 100 },
  "advanced-certification": { name: "Advanced Certification", requiredPoints: 200 },
  "expert-certification": { name: "Expert Certification", requiredPoints: 500 },
  "master-certification": { name: "Master Certification", requiredPoints: 1000 },
};

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakState>(() => {
    // Initialize with default state
    return DEFAULT_STREAK_STATE;
  });

  // Load streak data from localStorage when component mounts and user is authenticated
  useEffect(() => {
    if (!user) {
      setStreak(DEFAULT_STREAK_STATE);
      return;
    }
    
    const userId = user.id;
    const savedStreakKey = `veno-streak-${userId}`; // User-specific storage key
    
    const savedStreak = localStorage.getItem(savedStreakKey);
    if (savedStreak) {
      try {
        const parsed = JSON.parse(savedStreak);
        setStreak({
          ...parsed,
          visitedPages: new Set(parsed.visitedPages || []),
          watchedVideos: new Set(parsed.watchedVideos || []),
          unlockedCourses: new Set(parsed.unlockedCourses || ["intro-course"]),
          inactiveDays: parsed.inactiveDays || [],
          completedQuizzes: new Set(parsed.completedQuizzes || []),
        });
      } catch (error) {
        console.error("Error parsing saved streak data:", error);
        setStreak(DEFAULT_STREAK_STATE);
      }
    }
  }, [user]);

  // Save streak to localStorage whenever it changes and user is authenticated
  useEffect(() => {
    if (!user) return;
    
    const userId = user.id;
    const savedStreakKey = `veno-streak-${userId}`; // User-specific storage key
    
    try {
      const serializedStreak = {
        ...streak,
        visitedPages: Array.from(streak.visitedPages),
        watchedVideos: Array.from(streak.watchedVideos),
        unlockedCourses: Array.from(streak.unlockedCourses),
        completedQuizzes: Array.from(streak.completedQuizzes),
      };
      
      localStorage.setItem(savedStreakKey, JSON.stringify(serializedStreak));
    } catch (error) {
      console.error("Error saving streak data:", error);
    }
  }, [streak, user]);

  // Check if user is active today - runs on mount and when user changes
  useEffect(() => {
    if (!user) return;
    
    const checkDailyStreak = () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get saved streak to compare
      const userId = user.id;
      const savedStreakKey = `veno-streak-${userId}`;
      const savedStreak = localStorage.getItem(savedStreakKey);
      
      if (savedStreak) {
        const parsed = JSON.parse(savedStreak);
        const lastActivity = parsed.lastActivity;
        
        // Only update if we haven't checked today
        if (lastActivity !== today) {
          if (isConsecutiveDay(lastActivity)) {
            // Consecutive day - increment streak
            setStreak(prev => {
              const newStreak = prev.currentStreak + 1;
              toast.success(`🔥 Day ${newStreak} streak! Keep it up!`);
              
              return {
                ...prev,
                currentStreak: newStreak,
                lastActivity: today,
              };
            });
          } else if (lastActivity) {
            // User broke their streak - RESET streak counter only, keep points
            const newInactiveDays = [...parsed.inactiveDays || []];
            
            if (lastActivity && !newInactiveDays.includes(lastActivity)) {
              newInactiveDays.push(lastActivity);
            }
            
            setStreak(prev => ({
              ...prev,
              currentStreak: 1,
              lastActivity: today,
              inactiveDays: newInactiveDays,
            }));
            toast.info("Your streak was reset, but your points are safe! Start a new streak today!");
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
      } else {
        // No saved data - first time
        setStreak(prev => ({
          ...prev,
          currentStreak: 1,
          lastActivity: today,
        }));
        toast.success("🎉 You've started your first streak! Welcome to Veno!");
      }
    };
    
    // Check immediately on mount
    checkDailyStreak();
    
    // Also check every hour in case day changes while user is active
    const interval = setInterval(checkDailyStreak, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Check for course unlocks when points change
  useEffect(() => {
    if (!user) return;
    
    // Check each certification course to see if it can be unlocked
    Object.entries(CERTIFICATION_COURSES).forEach(([courseId, courseInfo]) => {
      if (
        streak.points >= courseInfo.requiredPoints && 
        !streak.unlockedCourses.has(courseId)
      ) {
        // Unlock this course!
        setStreak(prev => {
          const newUnlockedCourses = new Set(prev.unlockedCourses);
          newUnlockedCourses.add(courseId);
          
          toast.success(
            <div className="flex flex-col gap-1">
              <p className="font-bold">🎓 New Course Unlocked!</p>
              <p>{courseInfo.name} is now available</p>
              <p className="text-xs text-muted-foreground">Earned with {courseInfo.requiredPoints} streak points</p>
            </div>
          );
          
          return {
            ...prev,
            unlockedCourses: newUnlockedCourses
          };
        });
      }
    });
  }, [streak.points, user]);

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
    if (!user || streak.visitedPages.has(page)) return;
    
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
    if (!user || streak.watchedVideos.has(videoId)) return;
    
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

  const addQuizCompletion = (quizId: string, score: number) => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    setStreak(prev => {
      // Check if already completed this quiz today
      const quizKey = `${quizId}-${today}`;
      if (prev.completedQuizzes.has(quizKey)) return prev;
      
      const newCompletedQuizzes = new Set(prev.completedQuizzes);
      newCompletedQuizzes.add(quizKey);
      
      // Award points based on score
      let pointsEarned = 5; // Base points for completing
      if (score >= 80) pointsEarned += 10; // Bonus for high score
      else if (score >= 60) pointsEarned += 5; // Bonus for good score
      
      const newPoints = prev.points + pointsEarned;
      
      // Update streak if this is a new day
      let newStreak = prev.currentStreak;
      let newLastActivity = prev.lastActivity;
      
      if (prev.lastActivity !== today) {
        if (isConsecutiveDay(prev.lastActivity)) {
          newStreak = prev.currentStreak + 1;
          toast.success(`🔥 Day ${newStreak} streak! Quiz completed!`);
        } else if (!prev.lastActivity) {
          newStreak = 1;
          toast.success("🎉 First quiz streak started!");
        }
        newLastActivity = today;
      }
      
      toast.success(`🎯 +${pointsEarned} streak points! Score: ${score}%`);
      
      return {
        ...prev,
        currentStreak: newStreak,
        lastActivity: newLastActivity,
        points: newPoints,
        completedQuizzes: newCompletedQuizzes,
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

  const isCourseUnlocked = (courseId: string): boolean => {
    return streak.unlockedCourses.has(courseId);
  };

  return (
    <StreakContext.Provider 
      value={{ 
        streak, 
        addPageVisit, 
        addVideoWatch,
        addQuizCompletion,
        getStreakMessage,
        isCourseUnlocked
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
