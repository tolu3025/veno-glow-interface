
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

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

const MyTestsSection = ({ onShare }: MyTestsSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      if (!user) {
        setTests([]);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch user tests from Supabase
        const { data, error } = await supabase
          .from('user_tests')
          .select('*, test_attempts(score)')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching tests:", error);
          throw error;
        }

        if (data && data.length > 0) {
          // Transform the data to match our Test type
          const transformedTests: Test[] = data.map(test => {
            // Calculate average score from attempts
            let avgScore = 0;
            const testAttempts = test.test_attempts || [];
            
            if (testAttempts.length > 0) {
              const sum = testAttempts.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0);
              avgScore = Math.round(sum / testAttempts.length);
            }
            
            return {
              id: test.id,
              title: test.title,
              description: test.description || "",
              questionCount: test.question_count,
              createdAt: test.created_at,
              attempts: testAttempts.length,
              avgScore: avgScore
            };
          });
          
          setTests(transformedTests);
        } else {
          setTests([]);
        }
      } catch (err) {
        console.error("Failed to fetch tests:", err);
        toast({
          title: "Error loading tests",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [user, toast]);

  const editTest = (testId: string) => {
    navigate(`/cbt/edit/${testId}`);
  };

  const viewStats = (testId: string) => {
    navigate(`/cbt/stats/${testId}`);
  };

  const deleteTest = async (testId: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Delete the test from Supabase
      const { error } = await supabase
        .from('user_tests')
        .delete()
        .eq('id', testId)
        .eq('creator_id', user.id);
        
      if (error) throw error;
      
      // Update UI
      setTests(tests.filter(test => test.id !== testId));
      
      toast({
        title: "Test deleted",
        description: "Your test has been deleted successfully",
      });
    } catch (err) {
      console.error("Failed to delete test:", err);
      toast({
        title: "Error deleting test",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
