import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Components
import { TestTakerInfo } from '@/components/cbt/TestTakerForm';
import LoadingState from '@/components/cbt/test/LoadingState';
import NoQuestionsState from '@/components/cbt/test/NoQuestionsState';
import SubmissionComplete from '@/components/cbt/test/SubmissionComplete';
import TestInstructions from '@/components/cbt/test/TestInstructions';
import QuestionDisplay from '@/components/cbt/test/QuestionDisplay';
import TestResults from '@/components/cbt/test/TestResults';
import AnswersReview from '@/components/cbt/test/AnswersReview';

interface ShareCodeTestStateManagerProps {
  testId: string;
  testTakerInfo: TestTakerInfo;
}

interface TestDetails {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  time_limit: number | null;
  results_visibility: 'creator_only' | 'test_takers' | 'public';
  allow_retakes: boolean;
  share_code?: string;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  answer: number;
  explanation?: string;
}

const ShareCodeTestStateManager: React.FC<ShareCodeTestStateManagerProps> = ({ 
  testId, 
  testTakerInfo 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Test data state
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  
  // Test execution state
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [score, setScore] = useState(0);
  const [savingError, setSavingError] = useState<string | null>(null);

  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      if (!testId) return;
      
      setLoading(true);
      try {
        // Load test details
        const { data: testData, error: testError } = await supabase
          .from('user_tests')
          .select('*')
          .eq('id', testId)
          .single();
          
        if (testError || !testData) {
          console.error("Error fetching test data:", testError);
          toast.error("Test not found or access denied");
          navigate('/');
          return;
        }
        
        setTestDetails(testData as TestDetails);
        
        // Load questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('user_test_questions')
          .select('*')
          .eq('test_id', testId);
          
        if (questionsError) {
          console.error("Error fetching questions:", questionsError);
          throw questionsError;
        }
        
        if (questionsData && questionsData.length > 0) {
          const formattedQuestions: Question[] = questionsData.map(q => ({
            id: q.id,
            question_text: q.question_text,
            options: Array.isArray(q.options) ? q.options.map(opt => String(opt)) : [],
            answer: q.answer,
            explanation: q.explanation
          }));
          
          setQuestions(formattedQuestions);
          setUserAnswers(new Array(formattedQuestions.length).fill(null));
        } else {
          console.warn("No questions found for test ID:", testId);
          toast.error("No questions available for this test");
        }
      } catch (error) {
        console.error("Error loading test:", error);
        toast.error("Failed to load test");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, navigate]);

  // Timer effect
  useEffect(() => {
    if (testStarted && timeRemaining > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, timeRemaining, showResults]);

  const startTest = () => {
    setTestStarted(true);
    if (testDetails?.time_limit) {
      setTimeRemaining(testDetails.time_limit * 60); // Convert minutes to seconds
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(userAnswers[currentQuestion + 1]);
    } else {
      finishTest();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(userAnswers[currentQuestion - 1]);
    }
  };

  const finishTest = async () => {
    try {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach((question, index) => {
        if (userAnswers[index] === question.answer) {
          correctAnswers++;
        }
      });
      
      const finalScore = correctAnswers;
      setScore(finalScore);
      setShowResults(true);
      
      // Calculate time taken
      const timeTaken = testDetails?.time_limit ? (testDetails.time_limit * 60) - timeRemaining : 0;
      
      // Save test completion
      const completionData = {
        test_id: testId,
        user_id: null, // No user ID for unregistered users
        participant_name: testTakerInfo.name,
        participant_email: testTakerInfo.email,
        score: finalScore,
        total_questions: questions.length,
        time_taken: timeTaken,
        completed_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('test_attempts')
        .insert(completionData);

      if (error) {
        console.error('Error saving test completion:', error);
        setSavingError('Failed to save test results');
      }
      
    } catch (error) {
      console.error('Error finishing test:', error);
      setSavingError('Failed to save test results');
    }
  };

  const formatUserAnswersForReview = () => {
    return userAnswers.map((selectedOption, index) => {
      const question = questions[index];
      const correctAnswer = question?.answer || 0;
      return {
        selectedOption,
        isCorrect: selectedOption === correctAnswer
      };
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render loading state
  if (loading) {
    return <LoadingState />;
  }

  // Render no questions state
  if (questions.length === 0) {
    return <NoQuestionsState />;
  }

  // Render pre-test state
  if (!testStarted) {
    return (
      <TestInstructions
        testDetails={testDetails}
        questions={questions}
        location={location}
        previousAttempts={0}
        onStartTest={startTest}
        onShowTakerForm={() => {}} // Not needed for share code tests
        user={null}
        testId={testId}
        testTakerInfo={testTakerInfo}
      />
    );
  }

  // Render results states
  if (showResults) {
    // Handle different visibility options
    if (testDetails?.results_visibility === 'creator_only') {
      return (
        <SubmissionComplete 
          testDetails={testDetails} 
          testTakerInfo={testTakerInfo} 
        />
      );
    }

    if (reviewMode) {
      return (
        <div className="pb-10">
          <AnswersReview
            questions={questions}
            userAnswers={formatUserAnswersForReview()}
            score={score}
            timeRemaining={timeRemaining}
            testDetails={testDetails}
            location={location}
            onBackToSummary={() => setReviewMode(false)}
            onFinish={() => window.close()} // Close tab for public tests
            formatTime={formatTime}
          />
        </div>
      );
    }
    
    return (
      <TestResults
        score={score}
        questions={questions}
        testDetails={testDetails}
        timeRemaining={timeRemaining}
        location={location}
        testId={testId}
        publicResults={[]}
        testTakerInfo={testTakerInfo}
        user={null}
        onReviewAnswers={() => setReviewMode(true)}
        onFinish={() => window.close()} // Close tab for public tests
        onTryAgain={undefined} // No retry for share code tests
        formatTime={formatTime}
        savingError={savingError}
      />
    );
  }

  // Render question display
  const currentQuestionData = questions[currentQuestion];

  if (!currentQuestionData) {
    return <NoQuestionsState />;
  }

  return (
    <QuestionDisplay
      currentQuestion={currentQuestion}
      questions={questions}
      timeRemaining={timeRemaining}
      selectedAnswer={selectedAnswer}
      onAnswerSelect={handleAnswerSelect}
      onPreviousQuestion={goToPreviousQuestion}
      onNextQuestion={goToNextQuestion}
      formatTime={formatTime}
    />
  );
};

export default ShareCodeTestStateManager;