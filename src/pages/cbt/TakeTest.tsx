
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, Trophy, AlertTriangle } from 'lucide-react';
import { VenoLogo } from '@/components/ui/logo';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
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

  // Get the settings from location state or use defaults
  const settings = location.state?.settings || {
    difficulty: 'beginner',
    timeLimit: 15,
    questionsCount: 10
  };

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        if (testId === 'subject' && location.state?.subject) {
          // Load questions for a specific subject
          const subject = location.state.subject;
          const difficultyFilter = settings.difficulty === 'all' 
            ? ['beginner', 'intermediate', 'advanced'] 
            : [mapDifficulty(settings.difficulty)];
          
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
              text: q.question_text,
              options: Array.isArray(q.options) ? 
                q.options.map((opt: any) => String(opt)) : [],
              correctOption: q.correct_option_index
            }));
            
            setQuestions(formattedQuestions);
          } else {
            // If no questions found, provide demo questions
            setQuestions(generateDemoQuestions(subject));
          }
        } else {
          // Handle specific test ID case
          // In a real app, fetch the specific test by ID
          console.log("Loading specific test:", testId);
          // For now, use demo questions
          setQuestions(generateDemoQuestions("Demo"));
        }
      } catch (error) {
        console.error("Error loading questions:", error);
        toast.error("Failed to load questions");
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestions();
  }, [testId, location.state, settings]);
  
  // Map our UI difficulty levels to database difficulty levels
  const mapDifficulty = (uiDifficulty: string) => {
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

  const startTest = () => {
    setTimeRemaining(settings.timeLimit * 60);
    setTestStarted(true);
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
  };

  const goToNextQuestion = () => {
    // Check if the answer is correct before moving on
    if (selectedAnswer === questions[currentQuestion].correctOption) {
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

  const finishTest = () => {
    setShowResults(true);
    
    // Save test results to database if user is logged in
    if (user) {
      saveTestResults();
    }
  };

  const saveTestResults = async () => {
    try {
      if (!user) return;
      
      const testData = {
        user_id: user.id,
        test_id: testId || 'subject_quiz',
        subject: location.state?.subject || 'General',
        score: score,
        total_questions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        completed_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('test_results')
        .insert([testData]);
        
      if (error) throw error;
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
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <VenoLogo className="h-6 w-6" />
            <CardTitle>Ready to Start?</CardTitle>
          </div>
          <CardDescription>
            {location.state?.subject || testId} Quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <div className="space-y-4">
            <div className="bg-secondary/30 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Quiz Information</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-medium">{location.state?.subject || "General"}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{questions.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Time Limit:</span>
                  <span className="font-medium">{settings.timeLimit} minutes</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className="font-medium capitalize">{settings.difficulty}</span>
                </li>
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
          <Button className="w-full" onClick={startTest}>
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    let resultMessage = "Good effort!";
    let resultClass = "text-amber-500";
    
    if (percentage >= 80) {
      resultMessage = "Excellent work!";
      resultClass = "text-green-500";
    } else if (percentage < 50) {
      resultMessage = "Keep practicing!";
      resultClass = "text-rose-500";
    }
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <VenoLogo className="h-6 w-6" />
            <CardTitle>Quiz Results</CardTitle>
          </div>
          <CardDescription>
            {location.state?.subject || testId} Quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <div className="text-center">
            <Trophy className="mx-auto h-12 w-12 text-veno-primary mb-4" />
            <h2 className="text-3xl font-bold mb-2">{percentage}%</h2>
            <p className={`text-lg font-medium ${resultClass} mb-6`}>
              {resultMessage}
            </p>
            <div className="bg-secondary/30 p-4 rounded-lg mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Score</span>
                <span>{score} / {questions.length}</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Thank you for completing the quiz! 
              {user ? " Your results have been saved." : " Sign in to save your results."}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/cbt')}>
            Back to Tests
          </Button>
          <Button className="flex-1 bg-veno-primary hover:bg-veno-primary/90" onClick={() => {
            setCurrentQuestion(0);
            setSelectedAnswer(null);
            setScore(0);
            setShowResults(false);
            setTimeRemaining(settings.timeLimit * 60);
          }}>
            Try Again
          </Button>
        </CardFooter>
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
              {questions[currentQuestion].text}
            </h3>
          </div>
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
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
