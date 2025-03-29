
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Clock, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Quiz = {
  id: string;
  title: string;
  description: string;
  category: string;
  questionCount: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  timeEstimate: number;
  progress?: number;
};

// Mock quiz data - in a real app this would come from Supabase
const MOCK_QUIZZES: Quiz[] = [
  {
    id: "1",
    title: "Programming Fundamentals",
    description: "Core concepts every programmer should know",
    category: "Programming",
    questionCount: 15,
    difficulty: "beginner",
    timeEstimate: 15,
    progress: 65,
  },
  {
    id: "2",
    title: "Web Development Essentials",
    description: "HTML, CSS, and JavaScript basics",
    category: "Web",
    questionCount: 20,
    difficulty: "intermediate",
    timeEstimate: 25,
    progress: 30,
  },
  {
    id: "3",
    title: "Advanced Data Structures",
    description: "Complex algorithms and data organization",
    category: "Computer Science",
    questionCount: 12,
    difficulty: "advanced",
    timeEstimate: 30,
  },
];

const difficultyColors = {
  beginner: "text-green-500",
  intermediate: "text-amber-500",
  advanced: "text-rose-500",
};

const QuizSection = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with a delay
    const timer = setTimeout(() => {
      setQuizzes(MOCK_QUIZZES);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const startQuiz = (quizId: string) => {
    navigate(`/cbt/take/${quizId}`);
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
        {[1, 2, 3].map((i) => (
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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {quizzes.map((quiz) => (
        <motion.div 
          key={quiz.id}
          variants={itemVariants}
          className="veno-card"
        >
          <div className="p-4 sm:p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-lg">{quiz.title}</h3>
              <span className={cn("text-xs font-medium", difficultyColors[quiz.difficulty])}>
                {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {quiz.description}
            </p>
            
            {quiz.progress !== undefined && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span className="font-medium">{quiz.progress}%</span>
                </div>
                <Progress value={quiz.progress} className="h-2" />
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 rounded-full px-2.5 py-1">
                <BookOpen size={12} className="mr-1" />
                {quiz.questionCount} questions
              </div>
              <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 rounded-full px-2.5 py-1">
                <Clock size={12} className="mr-1" />
                {quiz.timeEstimate} mins
              </div>
              <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 rounded-full px-2.5 py-1">
                <Award size={12} className="mr-1" />
                {quiz.category}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="default" 
                size="sm" 
                className="bg-veno-primary hover:bg-veno-primary/90"
                onClick={() => startQuiz(quiz.id)}
              >
                Start Quiz <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default QuizSection;
