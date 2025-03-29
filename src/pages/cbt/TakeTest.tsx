
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, Trophy, AlertTriangle, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { VenoLogo } from '@/components/ui/logo';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TestTakerForm, { TestTakerInfo } from '@/components/cbt/TestTakerForm';

type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
};

type UserAnswer = {
  questionId: string;
  selectedOption: number | null;
  isCorrect: boolean;
};

type TestDetails = {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  time_limit: number | null;
  results_visibility: 'creator_only' | 'test_takers' | 'public';
  allow_retakes: boolean;
};

const TakeTest = () => {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  const [showTakerForm, setShowTakerForm] = useState(false);
  const [testTakerInfo, setTestTakerInfo] = useState<TestTakerInfo | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<number>(0);

  // Get the settings from location state or use defaults
  const settings = location.state?.settings || {
    difficulty: 'beginner',
    timeLimit: 15,
    questionsCount: 10
  };

  useEffect(() => {
    const loadTest = async () => {
      setLoading(true);

      if (testId === 'subject' && location.state?.subject) {
        loadSubjectQuiz();
        return;
      }
      
      try {
        // Load specific test by ID
        if (testId) {
          // First, get test details
          const { data: testData, error: testError } = await supabase
            .from('user_tests')
            .select('*')
            .eq('id', testId)
            .single();
            
          if (testError) throw testError;
          
          if (!testData) {
            toast.error("Test not found");
            navigate('/cbt');
            return;
          }
          
          setTestDetails(testData as TestDetails);
          
          // If user is logged in, check previous attempts
          if (user && !testData.allow_retakes) {
            const { data: attempts, error: attemptsError } = await supabase
              .from('test_attempts')
              .select('*', { count: 'exact' })
              .eq('test_id', testId)
              .eq('user_id', user.id);
              
            if (!attemptsError && attempts && attempts.length > 0) {
              setPreviousAttempts(attempts.length);
            }
          }
          
          // Then, get test questions
          const { data: questionsData, error: questionsError } = await supabase
            .from('user_test_questions')
            .select('*')
            .eq('test_id', testId);
            
          if (questionsError) throw questionsError;
          
          if (questionsData && questionsData.length > 0) {
            // Transform question data to match our QuizQuestion type
            const formattedQuestions: QuizQuestion[] = questionsData.map(q => ({
              id: q.id,
              text: q.question_text,
              options: Array.isArray(q.options) ? q.options : [],
              correctOption: q.answer
            }));
            
            setQuestions(formattedQuestions);
          } else {
            // If no questions found, show error
            toast.error("No questions available for this test");
          }
        }
      } catch (error) {
        console.error("Error loading test:", error);
        toast.error("Failed to load test");
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, user]);
  
  const loadSubjectQuiz = async () => {
    try {
      const subject = location.state.subject;
      
      // Map UI difficulty to database difficulty and handle 'all' case
      const difficultyFilter = settings.difficulty === 'all' 
        ? ['beginner', 'intermediate', 'advanced'] as const 
        : [mapDifficulty(settings.difficulty)] as const;
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject', subject)
        .in('difficulty', difficultyFilter)
        .limit(settings.questionsCount);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Transform Supabase data to match our QuizQuestion type
        const formattedQuestions: QuizQuestion[] = data.map(q => ({
          id: q.id,
          text: q.question, // Use question instead of question_text
          options: Array.isArray(q.options) ? 
            q.options.map((opt: any) => String(opt)) : [],
          correctOption: q.answer // Use answer instead of correct_option_index
        }));
        
        setQuestions(formattedQuestions);
      } else {
        // If no questions found, provide demo questions
        setQuestions(generateDemoQuestions(subject));
      }
    } catch (error) {
      console.error("Error loading subject questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };
  
  // Map our UI difficulty levels to database difficulty levels
  const mapDifficulty = (uiDifficulty: string): "beginner" | "intermediate" | "advanced" => {
    switch(uiDifficulty) {
      case 'easy': return 'beginner';
      case 'medium': return 'intermediate';
      case 'hard': return 'advanced';
      default: return 'beginner';
    }
  };

  useEffect(() => {
    if (testStarted && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (testStarted && timeRemaining === 0) {
      finishTest();
    }
  }, [timeRemaining, testStarted]);

  const handleTestTakerSubmit = (data: TestTakerInfo) => {
    setTestTakerInfo(data);
    setShowTakerForm(false);
    startTest();
  };

  const startTest = () => {
    const timeLimit = testDetails?.time_limit || settings.timeLimit || 15;
    setTimeRemaining(timeLimit * 60);
    setTestStarted(true);
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
  };

  const goToNextQuestion = () => {
    // Record the user's answer
    const currentQuestionData = questions[currentQuestion];
    if (!currentQuestionData) return;
    
    const isCorrect = selectedAnswer === currentQuestionData.correctOption;
    
    // Save the user's answer
    setUserAnswers(prev => [
      ...prev,
      {
        questionId: currentQuestionData.id,
        selectedOption: selectedAnswer,
        isCorrect: isCorrect
      }
    ]);
    
    // Update the score if correct
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Move to the next question or finish the test
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    // If we're finishing without completing all questions, record remaining answers as null
    if (userAnswers.length < questions.length) {
      const remainingAnswers = questions.slice(userAnswers.length).map(q => ({
        questionId: q.id,
        selectedOption: null,
        isCorrect: false
      }));
      
      setUserAnswers(prev => [...prev, ...remainingAnswers]);
    }
    
    setShowResults(true);
    
    // Save test results
    try {
      const testData = {
        test_id: testId,
        score: score,
        total_questions: questions.length,
        time_taken: (testDetails?.time_limit || settings.timeLimit || 15) * 60 - timeRemaining,
        user_id: user?.id || null,
        participant_email: testTakerInfo?.email || user?.email || '',
        participant_name: testTakerInfo?.name || user?.user_metadata?.full_name || '',
        completed_at: new Date().toISOString(),
      };
      
      await supabase.from('test_attempts').insert([testData]);
    } catch (error) {
      console.error("Error saving test results:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Helper function to generate demo questions if needed
  const generateDemoQuestions = (subject: string): QuizQuestion[] => {
    return [
      {
        id: '1',
        text: `What is the capital of France? (Demo ${subject} question)`,
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctOption: 1
      },
      {
        id: '2',
        text: `Which planet is known as the Red Planet? (Demo ${subject} question)`,
        options: ['Earth', 'Mars', 'Venus', 'Jupiter'],
        correctOption: 1
      },
      {
        id: '3',
        text: `What is the largest mammal? (Demo ${subject} question)`,
        options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
        correctOption: 1
      },
    ];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-veno-primary mb-4" />
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <VenoLogo className="h-6 w-6" />
            <CardTitle>No Questions Available</CardTitle>
          </div>
          <CardDescription>
            We couldn't find any questions for this test.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <p className="mb-4">There are currently no questions available for this subject or test.</p>
          <Button onClick={() => navigate('/cbt')}>
            Back to Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!testStarted) {
    // Check if the user has already taken this test
    if (previousAttempts > 0 && testDetails && !testDetails.allow_retakes) {
      return (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <VenoLogo className="h-6 w-6" />
              <CardTitle>Test Already Taken</CardTitle>
            </div>
            <CardDescription>
              {testDetails?.title || ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <p className="mb-4">
              You have already taken this test and multiple attempts are not allowed.
            </p>
            <Button onClick={() => navigate('/cbt')}>
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Show test taker form if needed
    if (showTakerForm) {
      return (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <VenoLogo className="h-6 w-6" />
              <CardTitle>Test Registration</CardTitle>
            </div>
            <CardDescription>
              {testDetails?.title || location.state?.subject || "Quiz"}
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <TestTakerForm 
              onSubmit={handleTestTakerSubmit} 
              testTitle={testDetails?.title || undefined}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <VenoLogo className="h-6 w-6" />
            <CardTitle>Ready to Start?</CardTitle>
          </div>
          <CardDescription>
            {testDetails?.title || location.state?.subject || testId} Quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <div className="space-y-4">
            <div className="bg-secondary/30 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Quiz Information</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-medium">
                    {testDetails?.title || location.state?.subject || "General"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{questions.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Time Limit:</span>
                  <span className="font-medium">
                    {testDetails?.time_limit || settings.timeLimit || 15} minutes
                  </span>
                </li>
                {testDetails && (
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Multiple Attempts:</span>
                    <span className="font-medium">{testDetails.allow_retakes ? 'Allowed' : 'Not allowed'}</span>
                  </li>
                )}
              </ul>
            </div>
            <div className="bg-secondary/30 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Instructions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Read each question carefully</li>
                <li>Select the best answer from the options</li>
                <li>You can't go back to previous questions</li>
                <li>The test will automatically submit when time runs out</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => {
            // If user is not logged in and not a subject quiz, show the form
            if (!user && testId !== 'subject') {
              setShowTakerForm(true);
            } else {
              startTest();
            }
          }}>
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (showResults) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    let resultMessage = "Good effort!";
    let resultClass = "text-amber-500";
    
    if (percentage >= 80) {
      resultMessage = "Excellent work!";
      resultClass = "text-green-500";
    } else if (percentage < 50) {
      resultMessage = "Keep practicing!";
      resultClass = "text-rose-500";
    }
    
    // Review mode - show all questions with user answers and correct answers
    if (reviewMode) {
      return (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <VenoLogo className="h-6 w-6" />
              <CardTitle>Quiz Review</CardTitle>
            </div>
            <CardDescription>
              {testDetails?.title || location.state?.subject || testId} Quiz - Review your answers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-veno-primary" />
                  <h2 className="font-semibold">Final Score: {score}/{questions.length} ({percentage}%)</h2>
                </div>
                <div className="text-sm text-muted-foreground">
                  Time taken: {formatTime((testDetails?.time_limit || settings.timeLimit || 15) * 60 - timeRemaining)}
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
            
            <div className="space-y-8 mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No.</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Your Answer</TableHead>
                      <TableHead>Correct Answer</TableHead>
                      <TableHead className="w-16 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAnswers.map((answer, index) => {
                      const question = questions[index];
                      // Add null checking to prevent errors with undefined questions
                      if (!question) return null;
                      
                      return (
                        <TableRow key={question.id} className={answer.isCorrect ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/10"}>
                          <TableCell className="font-medium text-center">{index + 1}</TableCell>
                          <TableCell>{question.text || "Question not available"}</TableCell>
                          <TableCell>
                            {answer.selectedOption !== null && question.options && question.options[answer.selectedOption] ? 
                              question.options[answer.selectedOption] : 
                              <span className="text-muted-foreground italic">No answer</span>
                            }
                          </TableCell>
                          <TableCell className="font-medium">
                            {question.options && question.options[question.correctOption] ? 
                              question.options[question.correctOption] : 
                              "Not available"
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            {answer.isCorrect ? 
                              <CheckCircle className="h-5 w-5 text-green-600 inline" /> : 
                              <XCircle className="h-5 w-5 text-red-600 inline" />
                            }
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setReviewMode(false)}>
              Back to Summary
            </Button>
            <Button className="flex-1 bg-veno-primary hover:bg-veno-primary/90" onClick={() => navigate('/cbt')}>
              Finish Review
            </Button>
          </CardFooter>
        </Card>
      );
    }
    
    // Results summary view
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <VenoLogo className="h-6 w-6" />
            <CardTitle>Quiz Results</CardTitle>
          </div>
          <CardDescription>
            {testDetails?.title || location.state?.subject || testId} Quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <div className="text-center mb-8">
            <Trophy className="mx-auto h-12 w-12 text-veno-primary mb-4" />
            <h2 className="text-3xl font-bold mb-2">{percentage}%</h2>
            <p className={`text-lg font-medium ${resultClass} mb-2`}>
              {resultMessage}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You answered {score} out of {questions.length} questions correctly
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <div className="bg-secondary/30 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Quiz Statistics</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Score:</span>
                  <span className="font-medium">{score}/{questions.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Percentage:</span>
                  <span className="font-medium">{percentage}%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Correct answers:</span>
                  <span className="font-medium text-green-600">{score}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Wrong answers:</span>
                  <span className="font-medium text-red-600">{questions.length - score}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Time taken:</span>
                  <span className="font-medium">
                    {formatTime((testDetails?.time_limit || settings.timeLimit || 15) * 60 - timeRemaining)}
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="bg-secondary/30 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Performance Analysis</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span>{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Time Efficiency</span>
                    <span>
                      {Math.round(((testDetails?.time_limit || settings.timeLimit || 15) * 60 - timeRemaining) / 
                        ((testDetails?.time_limit || settings.timeLimit || 15) * 60) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.round(((testDetails?.time_limit || settings.timeLimit || 15) * 60 - timeRemaining) / 
                      ((testDetails?.time_limit || settings.timeLimit || 15) * 60) * 100)} 
                    className="h-2" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-secondary/30 p-4 rounded-lg text-center">
            <h3 className="font-medium mb-2">Review Your Answers</h3>
            <p className="text-sm text-muted-foreground mb-2">
              See all questions, your answers, and the correct answers
            </p>
            <Button 
              onClick={() => setReviewMode(true)}
              variant="outline" 
              className="text-veno-primary border-veno-primary/30"
            >
              <HelpCircle className="h-4 w-4 mr-2" /> 
              View Detailed Review
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/cbt')}>
            Back to Tests
          </Button>
          {(testDetails?.allow_retakes || testId === 'subject') && (
            <Button 
              className="flex-1 bg-veno-primary hover:bg-veno-primary/90" 
              onClick={() => {
                setCurrentQuestion(0);
                setSelectedAnswer(null);
                setScore(0);
                setShowResults(false);
                setUserAnswers([]);
                setTimeRemaining((testDetails?.time_limit || settings.timeLimit || 15) * 60);
                setTestStarted(false);
              }}
            >
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  const currentQuestionData = questions[currentQuestion];

  // Add safety check for current question
  if (!currentQuestionData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <VenoLogo className="h-6 w-6" />
            <CardTitle>Error</CardTitle>
          </div>
          <CardDescription>Question data not available</CardDescription>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <p className="mb-4">The current question could not be loaded.</p>
          <Button onClick={() => navigate('/cbt')}>
            Back to Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VenoLogo className="h-6 w-6" />
            <CardTitle>Question {currentQuestion + 1}/{questions.length}</CardTitle>
          </div>
          <div className="flex items-center gap-1 bg-secondary/30 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">{formatTime(timeRemaining)}</span>
          </div>
        </div>
        <div className="mt-2">
          <Progress 
            value={((currentQuestion + 1) / questions.length) * 100} 
            className="h-2"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-6">
              {currentQuestionData.text}
            </h3>
          </div>
          <div className="space-y-3">
            {currentQuestionData.options && currentQuestionData.options.map((option, index) => (
              <div 
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAnswer === index 
                    ? 'border-veno-primary bg-veno-primary/5' 
                    : 'hover:border-veno-primary/50'
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${
                    selectedAnswer === index 
                      ? 'border-veno-primary bg-veno-primary text-white' 
                      : 'border-muted-foreground text-muted-foreground'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{option}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          disabled={selectedAnswer === null}
          onClick={goToNextQuestion} 
          className="w-full"
        >
          {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TakeTest;
