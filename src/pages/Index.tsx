
import { useNavigate } from "react-router-dom";
import BannerCarousel from "@/components/home/BannerCarousel";
import FeaturesSection from "@/components/home/FeaturesSection";
import TutorialsSection from "@/components/home/TutorialsSection";
import TestimonialCard from "@/components/home/TestimonialCard";
import CallToAction from "@/components/home/CallToAction";
import BackgroundBubbles from "@/components/home/BackgroundBubbles";
import AdPlacement from "@/components/ads/AdPlacement";
import { bannerSlides, features, tutorials, testimonial } from "@/data/homePageData";
import { Button } from "@/components/ui/button";
import { StreakDisplay } from "@/components/streak/StreakDisplay";
import { useStreak } from "@/providers/StreakProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, GraduationCap } from "lucide-react";

// Update the tutorials data to include the required 'id' property
const tutorialsWithIds = tutorials.map((tutorial, index) => ({
  ...tutorial,
  id: `tutorial-${index + 1}`
}));

const Index = () => {
  const { streak, getStreakMessage, isCourseUnlocked } = useStreak();
  const isMobile = useIsMobile();
  
  // Simple test to see if the page renders at all
  return (
    <div className="pb-6 relative overflow-hidden">
      <div className="container py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to Veno</h1>
        <p className="text-center text-lg text-muted-foreground mb-8">
          Your premier educational platform for interactive learning and assessment.
        </p>
        
        {/* Basic content without complex components */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">Interactive CBT</h3>
            <p className="text-muted-foreground">Take comprehensive computer-based tests with real-time feedback.</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">Video Tutorials</h3>
            <p className="text-muted-foreground">Access high-quality video lessons and explanations.</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-muted-foreground">Get personalized learning support from our AI.</p>
          </div>
        </div>
        
        {/* User streak display - only if user has streak */}
        {streak.currentStreak > 0 && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-lg border bg-card">
            <div className="text-center">
              <p className="text-lg font-medium">🔥 {streak.currentStreak} day streak!</p>
              <p className="text-sm text-muted-foreground">{streak.points} points earned</p>
            </div>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-muted-foreground">
            Ready to start your learning journey? Choose from our comprehensive tools and resources.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
