
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
  
  return (
    <div className="pb-6 relative overflow-hidden">
      <BackgroundBubbles />
      
      {/* Hero Section with Banner Carousel */}
      <section className="relative pt-8 pb-16">
        <div className="container">
          <BannerCarousel bannerSlides={bannerSlides} />
        </div>
      </section>

      {/* User Streak Display */}
      {streak.currentStreak > 0 && (
        <section className="py-8">
          <div className="container">
            <div className="max-w-md mx-auto">
              <StreakDisplay variant="full" />
            </div>
          </div>
        </section>
      )}

      {/* Course Progress Table */}
      {streak.currentStreak > 0 && (
        <section className="py-8">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8">Course Progress</h2>
              <div className="veno-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tutorialsWithIds.map((tutorial, index) => {
                      const isUnlocked = isCourseUnlocked(tutorial.id);
                      const progress = Math.min((streak.currentStreak * 10) + (index * 5), 100);
                      
                      return (
                        <TableRow key={tutorial.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <tutorial.icon className="h-4 w-4 mr-2" />
                              {tutorial.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isUnlocked ? "default" : "secondary"}>
                              {isUnlocked ? "Unlocked" : "Locked"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-veno-primary h-2 rounded-full" 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-muted-foreground">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant={isUnlocked ? "default" : "secondary"}
                              disabled={!isUnlocked}
                              onClick={() => window.location.href = tutorial.href}
                            >
                              {isUnlocked ? "Continue" : "Locked"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <FeaturesSection features={features} />
        </div>
      </section>

      {/* Tutorials Section */}
      <section className="py-16">
        <div className="container">
          <TutorialsSection tutorials={tutorialsWithIds} />
        </div>
      </section>

      {/* Ad Placement */}
      <section className="py-8">
        <div className="container">
          <AdPlacement location="content" />
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16">
        <div className="container">
          <TestimonialCard quote={testimonial.quote} author={testimonial.author} />
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16">
        <div className="container">
          <CallToAction />
        </div>
      </section>

      {/* Bottom Ad Placement */}
      <section className="py-8">
        <div className="container">
          <AdPlacement location="footer" />
        </div>
      </section>
    </div>
  );
};

export default Index;
