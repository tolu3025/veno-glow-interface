
import { ArrowLeft, BookOpen, FileCheck, Monitor, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdPlacement from "@/components/ads/AdPlacement";
import { playSound } from "@/utils/soundEffects";
import LoadingState from "@/components/cbt/test/LoadingState";
import { useState, useEffect } from "react";

const CbtPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading state to improve user experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  const cbtModules = [
    {
      title: "Introduction to Programming",
      description: "Learn the basics of programming concepts and logic. Our comprehensive module covers fundamental programming principles, problem-solving approaches, and introductory algorithm design.",
      icon: Monitor,
      progress: 75,
    },
    {
      title: "Web Development Fundamentals",
      description: "HTML, CSS and JavaScript basics for web development. This course provides hands-on experience building responsive web pages and interactive user interfaces.",
      icon: BookOpen,
      progress: 45,
    },
    {
      title: "Data Structures",
      description: "Understanding key data structures and algorithms. Master essential concepts like arrays, linked lists, trees, and graphs while learning how to analyze algorithmic efficiency.",
      icon: FileCheck,
      progress: 20,
    },
  ];

  const handleNavigation = (path: string) => {
    playSound('click', 0.3);
    navigate(path);
  };
  
  if (isLoading) {
    return (
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => handleNavigation('/')}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary mr-3"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">Veno CBT</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2 border-l-4 border-l-veno-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Computer Based Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-5">
              Create tests, manage questions, and track performance with our comprehensive CBT platform.
              Our system enables educators to design custom assessments while providing students with
              immediate feedback and performance analytics.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Button 
                onClick={() => handleNavigation('/cbt/create')}
                className="bg-veno-primary hover:bg-veno-primary/90 w-full md:max-w-xs"
                size={isMobile ? "sm" : "default"}
              >
                Create New Test
              </Button>
              <Button
                onClick={() => handleNavigation('/cbt/public-leaderboards')}
                variant="secondary"
                size={isMobile ? "sm" : "default"}
                className="w-full md:max-w-xs flex items-center gap-2 justify-center"
              >
                <Trophy size={16} />
                Leaderboards
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-veno-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Tests Created</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Tests Taken</span>
                <span className="font-medium">48</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Score</span>
                <span className="font-medium">72%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-lg font-medium mb-4">Your Learning Path</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Continue your personalized learning journey with these recommended modules.
        Each module is designed to build on previous knowledge and enhance your understanding
        of key concepts in computer science and programming.
      </p>
      
      <div className="space-y-4 mb-8">
        {cbtModules.map((module, index) => (
          <motion.div 
            key={module.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="veno-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleNavigation('/cbt/')}
            role="button"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 max-w-[70%]">
                <div className="rounded-lg bg-veno-primary/10 p-2 text-veno-primary shrink-0">
                  <module.icon size={18} />
                </div>
                <h3 className="font-medium text-sm truncate">{module.title}</h3>
              </div>
              <span className="text-sm font-medium text-veno-primary shrink-0">{module.progress}%</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{module.description}</p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-veno-primary h-2 rounded-full" 
                style={{ width: `${module.progress}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="bg-muted/30 p-5 rounded-lg mb-8">
        <h3 className="text-lg font-medium mb-3">Learning Resources</h3>
        <p className="text-sm mb-4">
          Enhance your understanding with these additional learning materials and resources.
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Interactive programming tutorials with step-by-step guidance</li>
          <li>Comprehensive video lectures from industry professionals</li>
          <li>Practice exercises to reinforce theoretical concepts</li>
          <li>Community forums for peer learning and problem-solving</li>
          <li>Expert feedback on programming assignments and projects</li>
        </ul>
      </div>
      
      <div className="my-6">
        <AdPlacement location="content" contentCheck={false} />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <Button 
          className="w-full bg-veno-primary hover:bg-veno-primary/90"
          onClick={() => handleNavigation('/cbt')}
        >
          Explore Courses
        </Button>
        <Button 
          variant="outline"
          className="w-full"
          onClick={() => handleNavigation('/services')}
        >
          View All Services
        </Button>
      </div>
    </div>
  );
};

export default CbtPage;
