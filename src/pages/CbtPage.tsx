
import { ArrowLeft, BookOpen, FileCheck, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdPlacement from "@/components/ads/AdPlacement";

const CbtPage = () => {
  const navigate = useNavigate();
  
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

  return (
    <div className="pb-6">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Veno CBT</h1>
      </div>
      
      <p className="text-muted-foreground mb-6">Your personal computer-based training platform.</p>
      
      <div className="space-y-4">
        {cbtModules.map((module, index) => (
          <motion.div 
            key={module.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="veno-card p-5"
            onClick={() => navigate('/cbt/')}
            role="button"
          >
            <div className="flex justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-veno-primary/10 p-2 text-veno-primary">
                  <module.icon size={18} />
                </div>
                <h3 className="font-medium">{module.title}</h3>
              </div>
              <span className="text-sm font-medium text-veno-primary">{module.progress}%</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
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
      
      <div className="flex flex-col md:flex-row gap-4 mt-6">
        <button 
          className="veno-button flex-1"
          onClick={() => navigate('/cbt')}
        >
          Explore Courses
        </button>
        <button 
          className="veno-button-outline flex-1"
          // Updated to navigate to services page instead of tutorial page
          onClick={() => navigate('/services')}
        >
          View All Services
        </button>
      </div>
    </div>
  );
};

export default CbtPage;
