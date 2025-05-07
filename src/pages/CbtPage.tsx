
import { ArrowLeft, BookOpen, FileCheck, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdPlacement from "@/components/ads/AdPlacement";
import { playSound } from "@/utils/soundEffects";

const CbtPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const cbtModules = [
    {
      title: "Introduction to Programming",
      description: "Learn the basics of programming concepts and logic.",
      icon: Monitor,
      progress: 75,
    },
    {
      title: "Web Development Fundamentals",
      description: "HTML, CSS and JavaScript basics for web development.",
      icon: BookOpen,
      progress: 45,
    },
    {
      title: "Data Structures",
      description: "Understanding key data structures and algorithms.",
      icon: FileCheck,
      progress: 20,
    },
  ];

  const handleNavigation = (path: string) => {
    playSound('click', 0.3);
    navigate(path);
  };

  return (
    <div className="pb-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => handleNavigation('/')}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">Veno CBT</h1>
      </div>
      
      <Card className="mb-6 border-l-4 border-l-veno-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Computer Based Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Create tests, manage questions, and track performance with our comprehensive CBT platform.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => handleNavigation('/cbt/create')}
              className="bg-veno-primary hover:bg-veno-primary/90"
              size={isMobile ? "sm" : "default"}
            >
              Create New Test
            </Button>
            <Button
              onClick={() => handleNavigation('/cbt/public-leaderboards')}
              variant="secondary"
              size={isMobile ? "sm" : "default"}
            >
              Leaderboards
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <h2 className="text-muted-foreground text-sm mb-4">Your personal computer-based training platform</h2>
      
      <div className="space-y-4">
        {cbtModules.map((module, index) => (
          <motion.div 
            key={module.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="veno-card p-5 cursor-pointer"
            onClick={() => handleNavigation('/cbt/')}
            role="button"
          >
            <div className="flex justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-veno-primary/10 p-2 text-veno-primary">
                  <module.icon size={18} />
                </div>
                <h3 className="font-medium text-sm sm:text-base">{module.title}</h3>
              </div>
              <span className="text-sm font-medium text-veno-primary">{module.progress}%</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">{module.description}</p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-veno-primary h-2 rounded-full" 
                style={{ width: `${module.progress}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="my-6">
        <AdPlacement location="content" contentCheck={false} />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
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
