
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Edit, Share2, BarChart4, Clock, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Test = {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  createdAt: string;
  attempts: number;
  avgScore: number;
};

interface MyTestsSectionProps {
  onShare: (testId: string) => void;
}

// Mock tests data - in a real app this would come from Supabase
const MOCK_TESTS: Test[] = [
  {
    id: "test1",
    title: "JavaScript Quiz",
    description: "Test your JavaScript knowledge",
    questionCount: 10,
    createdAt: "2023-09-15",
    attempts: 24,
    avgScore: 78,
  },
  {
    id: "test2",
    title: "React Fundamentals",
    description: "Core concepts of React framework",
    questionCount: 15,
    createdAt: "2023-10-02",
    attempts: 12,
    avgScore: 85,
  },
];

const MyTestsSection = ({ onShare }: MyTestsSectionProps) => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with a delay
    const timer = setTimeout(() => {
      setTests(MOCK_TESTS);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const editTest = (testId: string) => {
    navigate(`/cbt/edit/${testId}`);
  };

  const viewStats = (testId: string) => {
    navigate(`/cbt/stats/${testId}`);
  };

  const deleteTest = (testId: string) => {
    // In a real app, this would delete from Supabase
    setTests(tests.filter(test => test.id !== testId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="veno-card p-4 animate-pulse">
            <div className="h-6 w-2/3 bg-secondary rounded mb-3"></div>
            <div className="h-4 w-full bg-secondary/70 rounded mb-4"></div>
            <div className="flex justify-between">
              <div className="h-4 w-1/4 bg-secondary/50 rounded"></div>
              <div className="h-4 w-1/4 bg-secondary/50 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="mb-2 text-lg font-medium">No tests created yet</h3>
        <p className="text-muted-foreground mb-6">Create your first test to see it here</p>
        <Button 
          onClick={() => navigate('/cbt/create')}
          className="bg-veno-primary hover:bg-veno-primary/90"
        >
          Create Test
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {tests.map((test) => (
        <motion.div 
          key={test.id}
          variants={itemVariants}
          className="veno-card"
        >
          <div className="p-4 sm:p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-lg">{test.title}</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <span className="sr-only">Open menu</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                      <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem onClick={() => editTest(test.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare(test.id)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => viewStats(test.id)}>
                    <BarChart4 className="mr-2 h-4 w-4" />
                    <span>Statistics</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteTest(test.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {test.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 rounded-full px-2.5 py-1">
                <Clock size={12} className="mr-1" />
                Created {formatDate(test.createdAt)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 rounded-full px-2.5 py-1">
                <Users size={12} className="mr-1" />
                {test.attempts} attempts
              </div>
              <div className={cn(
                "flex items-center text-xs rounded-full px-2.5 py-1",
                test.avgScore >= 80 ? "bg-green-500/10 text-green-600" : 
                test.avgScore >= 60 ? "bg-amber-500/10 text-amber-600" : 
                "bg-rose-500/10 text-rose-600"
              )}>
                <BarChart4 size={12} className="mr-1" />
                {test.avgScore}% avg score
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-veno-primary/30 text-veno-primary"
                onClick={() => onShare(test.id)}
              >
                <Share2 size={14} className="mr-1" /> Share
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="bg-veno-primary hover:bg-veno-primary/90"
                onClick={() => navigate(`/cbt/take/${test.id}`)}
              >
                Start
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default MyTestsSection;
