
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
  
  // Certification courses available - this would come from your backend in a real app
  const certificationCourses = [
    { id: "basic-certification", name: "Basic Certification", requiredPoints: 50, difficulty: "Beginner" },
    { id: "intermediate-certification", name: "Intermediate Certification", requiredPoints: 100, difficulty: "Intermediate" },
    { id: "advanced-certification", name: "Advanced Certification", requiredPoints: 200, difficulty: "Advanced" },
    { id: "expert-certification", name: "Expert Certification", requiredPoints: 500, difficulty: "Expert" },
    { id: "master-certification", name: "Master Certification", requiredPoints: 1000, difficulty: "Master" }
  ];
  
  return (
    <div className="pb-6 relative overflow-hidden">
      <BackgroundBubbles />
      <BannerCarousel bannerSlides={bannerSlides} />
      
      {/* High-quality content section */}
      <div className="my-6 px-4 md:px-0">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">Welcome to Veno Learning Platform</h2>
          <p className="text-muted-foreground">
            Veno is the premier educational platform designed to transform your learning experience. 
            Our comprehensive tools and resources help students, educators, and lifelong learners 
            achieve their educational goals through interactive content, personalized assessments, 
            and cutting-edge technology.
          </p>
        </div>
        
        {/* User streak display - hidden on mobile */}
        {streak.currentStreak > 0 && !isMobile && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-lg border bg-card/50 backdrop-blur-sm">
            <StreakDisplay variant="full" className="items-center" />
          </div>
        )}
        
        {/* Strategically placed advertisement */}
        <AdPlacement location="header" contentCheck={false} />
      </div>
      
      <FeaturesSection features={features} />
      <TutorialsSection tutorials={tutorialsWithIds} />
      
      {/* Certificate courses section */}
      <div className="container my-10">
        <h2 className="text-2xl font-bold mb-6 text-center">Certification Courses</h2>
        <p className="text-center text-muted-foreground mb-8">Unlock certificates by earning streak points through daily activity and watching tutorials</p>
        
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Certificate</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Required Points</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificationCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      {course.name}
                    </div>
                  </TableCell>
                  <TableCell>{course.difficulty}</TableCell>
                  <TableCell className="text-right">{course.requiredPoints}</TableCell>
                  <TableCell className="text-right">
                    {isCourseUnlocked(course.id) ? (
                      <Badge variant="success" className="ml-auto">
                        <Award className="h-3.5 w-3.5 mr-1" />
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted ml-auto">
                        {streak.points}/{course.requiredPoints} Points
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Content-rich section with contextual ad */}
      <div className="container my-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-card p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold mb-4">Why Choose Veno for Your Educational Journey</h3>
            <p className="mb-4">
              Veno combines proven educational methodologies with innovative technology to create a 
              learning environment that adapts to your unique needs. Our platform offers:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Personalized learning paths tailored to your goals and learning style</li>
              <li>Comprehensive assessment tools to track your progress</li>
              <li>Expert-crafted content developed by leading educators</li>
              <li>Interactive tutorials that make complex subjects accessible</li>
              <li>Community features to connect with fellow learners</li>
              <li>Streak system to keep you motivated and engaged every day</li>
              <li>Points rewards for watching educational content</li>
              <li>Course certifications unlocked through consistent learning</li>
            </ul>
            <p>
              Whether you're preparing for exams, developing professional skills, or exploring new interests,
              Veno provides the structure, resources, and support you need to succeed.
            </p>
          </div>
          <div className="md:col-span-1">
            <AdPlacement location="sidebar" contentCheck={false} />
          </div>
        </div>
      </div>
      
      <TestimonialCard quote={testimonial.quote} author={testimonial.author} />
      <CallToAction />
      
      {/* Footer ad placement */}
      <div className="mt-10">
        <AdPlacement location="footer" contentCheck={false} />
      </div>
    </div>
  );
};

export default Index;
