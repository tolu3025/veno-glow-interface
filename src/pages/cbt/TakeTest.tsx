import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Json } from "@/integrations/supabase/types";
import { appendActivityAndUpdatePoints } from "@/utils/activityHelpers";

type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
};

const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const subjectFromState = location.state?.subject;
  
  const [test, setTest] = useState<{
    id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    timeLimit: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        
        // If we have a subject from state, use that to fetch questions
        if (subjectFromState) {
          const { data: questions, error } = await supabase
            .from('questions')
            .select('id, question, options, answer, subject')
            .eq('subject', subjectFromState)
            .limit(10);
            
          if (error) {
            throw error;
          }
          
          if (questions && questions.length > 0) {
            // Transform the questions to match our expected format
            const formattedQuestions: QuizQuestion[] = questions.map(q => ({
              id: q.id,
              text: q.question,
              options: Array.isArray(q.options) ? q.options.map(opt => String(opt)) : [],
              correctOption: q.answer
            }));
            
            // Create a test object with the questions
            const testObject = {
              id: 'subject-' + subjectFromState,
              title: subjectFromState + ' Quiz',
              description: 'Test your knowledge on ' + subjectFromState,
              questions: formattedQuestions,
              timeLimit: 10 // minutes
            };
            
            setTest(testObject);
            // Initialize answers array with nulls
            setAnswers(new Array(formattedQuestions.length).fill(null));
            // Set time remaining in seconds
            setTimeRemaining(10 * 60);
            
            // Record activity if user is logged in
            if (user) {
              await appendActivityAndUpdatePoints(user.id, {
                type: "quiz_started",
                subject: subjectFromState,
                timestamp: new Date().toISOString()
              });
            }
          } else {
            // No questions found for this subject
            toast({
              title: "No questions available",
              description: `We couldn't find any questions for ${subjectFromState}`,
              variant: "destructive",
            });
          }
        } else if (testId) {
          // Logic to fetch a specific test by ID could go here
          // For now, we'll just display an error
          toast({
            title: "Test not found",
            description: "The test you're looking for couldn't be located",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast({
          title: "Error",
          description: "Failed to load quiz questions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [testId, subjectFromState, toast, user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    
    // Update answers array
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(updatedAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (test?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(answers[currentQuestionIndex + 1]);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(answers[currentQuestionIndex - 1]);
    }
  };

  const jumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setSelectedOption(answers[index]);
  };

  const submitTest = () => {
    if (!test) return;
    
    setTestSubmitted(true);
    
    // Calculate score
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === test.questions[index].correctOption) {
        correct++;
      }
    });
    
    setCorrectAnswers(correct);
    const calculatedScore = Math.round((correct / test.questions.length) * 100);
    setScore(calculatedScore);
    
    // Save test result to Supabase if user is logged in
    if (user) {
      const saveResult = async () => {
        try {
          const { error } = await supabase.from('test_results').insert({
            user_email: user.email,
            subject: subjectFromState || 'Unknown',
            score: calculatedScore,
            test_id: test.id,
            creator_id: user.id
          });
          
          if (error) throw error;
          
          // Update user activity and add points based on score
          const pointsEarned = Math.floor(calculatedScore / 10); // 1 point for every 10% score
          
          await appendActivityAndUpdatePoints(user.id, {
            type: "quiz_completed",
            subject: subjectFromState,
            score: calculatedScore,
            points_earned: pointsEarned,
            timestamp: new Date().toISOString()
          }, pointsEarned);
          
        } catch (err) {
          console.error('Error saving test result:', err);
        }
      };
      
      saveResult();
    }
    
    // Show success message and confetti for good scores
    if (calculatedScore >= 70) {
      toast({
        title: "Great job!",
        description: `You scored ${calculatedScore}%`,
        variant: "default",
      });
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      toast({
        title: "Test completed",
        description: `You scored ${calculatedScore}%`,
        variant: "default",
      });
    }
  };

  const handleSubmitConfirm = () => {
    // Check for unanswered questions
    const unansweredCount = answers.filter(a => a === null).length;
    
    if (unansweredCount > 0) {
      const confirmed = window.confirm(`You have ${unansweredCount} unanswered ${
        unansweredCount === 1 ? 'question' : 'questions'
      }. Are you sure you want to submit?`);
      
      if (confirmed) {
        submitTest();
      }
    } else {
      submitTest();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-16 w-16 text-veno-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Loading test...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Test Not Found</h2>
        <p className="text-muted-foreground mb-6">The test you're looking for doesn't exist or has been removed.</p>
        <Button
          onClick={() => navigate('/cbt')}
          className="bg-veno-primary hover:bg-veno-primary/90"
        >
          Back to CBT Dashboard
        </Button>
      </div>
    );
  }

  if (testSubmitted) {
    return (
      <div className="pb-6">
        <div className="flex items-center space-x-4 mb-6">
          <button 
            onClick={() => navigate('/cbt')}
            className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold">Test Results</h1>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="veno-card p-6 mb-6 text-center"
        >
          <h2 className="text-xl font-bold mb-1">{test.title}</h2>
          <p className="text-muted-foreground mb-6">{test.description}</p>
          
          <div className="w-36 h-36 mx-auto mb-4 relative">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="text-secondary"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className={`${score >= 70 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}
                strokeWidth="10"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (score / 100 * 251.2)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold">
              {score}%
            </div>
          </div>
          
          <p className="mb-1">
            You answered <span className="font-bold text-veno-primary">{correctAnswers}</span> out of <span className="font-bold">{test.questions.length}</span> questions correctly.
          </p>
          
          <div className="mt-8">
            <Button
              onClick={() => setShowFeedback(!showFeedback)}
              variant="outline"
              className="mb-4"
            >
              {showFeedback ? "Hide Answers" : "Show Answers"}
            </Button>
            
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => navigate('/cbt')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
              
              <Button
                onClick={() => {
                  setTestSubmitted(false);
                  setCurrentQuestionIndex(0);
                  setAnswers(new Array(test.questions.length).fill(null));
                  setSelectedOption(null);
                  if (test.timeLimit) {
                    setTimeRemaining(test.timeLimit * 60);
                  }
                }}
                className="bg-veno-primary hover:bg-veno-primary/90"
              >
                Retake Test
              </Button>
            </div>
          </div>
          
          {showFeedback && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Review Questions</h3>
              
              {test.questions.map((question, index) => (
                <Card key={question.id} className={`p-4 ${answers[index] === question.correctOption ? 'border-green-500/30' : 'border-rose-500/30'}`}>
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {answers[index] === question.correctOption ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{index + 1}. {question.text}</h4>
                      <div className="grid gap-2">
                        {question.options.map((option, optIndex) => (
                          <div 
                            key={optIndex}
                            className={`p-2 rounded-md text-sm ${
                              optIndex === question.correctOption 
                                ? 'bg-green-500/20 border border-green-500/30' 
                                : optIndex === answers[index] 
                                  ? 'bg-rose-500/20 border border-rose-500/30' 
                                  : 'bg-secondary/40'
                            }`}
                          >
                            {option}
                            {optIndex === question.correctOption && (
                              <span className="ml-2 text-green-500">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              const confirmed = window.confirm("Are you sure you want to leave this test? Your progress will be lost.");
              if (confirmed) navigate('/cbt');
            }}
            className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold">{test.title}</h1>
        </div>
        
        {test.timeLimit && (
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            timeRemaining < 60 ? 'bg-rose-500/20 text-rose-500' : 'bg-secondary/70'
          }`}>
            <Clock size={14} className="mr-1" />
            {formatTime(timeRemaining)}
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Question {currentQuestionIndex + 1} of {test.questions.length}</span>
          <span>{Math.round(progress)}% completed</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="veno-card p-5 mb-6"
      >
        <h2 className="text-lg font-medium mb-4">{currentQuestion.text}</h2>
        
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedOption === index
                  ? 'border-veno-primary bg-veno-primary/10 text-veno-primary'
                  : 'border-border/50 bg-card hover:border-veno-primary/50'
              }`}
            >
              <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
            </button>
          ))}
        </div>
        
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {currentQuestionIndex < test.questions.length - 1 ? (
            <Button
              className="bg-veno-primary hover:bg-veno-primary/90"
              onClick={nextQuestion}
            >
              Next
            </Button>
          ) : (
            <Button
              className="bg-veno-primary hover:bg-veno-primary/90"
              onClick={handleSubmitConfirm}
            >
              Submit Test
            </Button>
          )}
        </div>
      </motion.div>
      
      <div className="veno-card p-4">
        <h3 className="text-sm font-medium mb-3">Question Navigator</h3>
        <div className="flex flex-wrap gap-2">
          {test.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => jumpToQuestion(index)}
              className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium ${
                index === currentQuestionIndex
                  ? 'bg-veno-primary text-white'
                  : answers[index] !== null
                    ? 'bg-veno-primary/20 text-veno-primary'
                    : 'bg-secondary'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            className="border-veno-primary/30 text-veno-primary text-sm"
            onClick={handleSubmitConfirm}
          >
            Submit Test
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
