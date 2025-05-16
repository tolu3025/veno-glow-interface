
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStreak } from "@/providers/StreakProvider";

export function RouteTracker() {
  const location = useLocation();
  const { addPageVisit } = useStreak();
  
  useEffect(() => {
    // Add the current path to visited pages
    if (location.pathname) {
      addPageVisit(location.pathname);
    }
  }, [location.pathname, addPageVisit]);

  return null; // This component doesn't render anything
}
