import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useLocation, Location } from 'react-router-dom';

// Define a correct custom Location type
type LocationWithState = Location & {
  state?: {
    subject?: string;
    settings?: {
      difficulty?: string;
      timeLimit?: number;
      questionsCount?: number;
    };
  };
};

interface UseTestManagementProps {
  testId: string | undefined;
  user: any;
  questions: any[];
  testDetails: any;
  testTakerInfo: any;
}

export type UserAnswer = {
  questionId: string;
  selectedOption: number | null;
  isCorrect: boolean;
};

export const useTestManagement = ({ 
  testId, 
  user, 
  questions, 
  testDetails, 
  testTakerInfo 
}: UseTestManagementProps) => {
  const navigate = useNavigate();
  const location = useLocation() as LocationWithState;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [publicResults, setPublicResults] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [testFinished, setTestFinished] = useState(false);

  useEffect(() => {
    if (testStarted && timeRemaining > 0 && !testFinished) {
      const timer = setTimeout(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (testStarted && timeRemaining === 0 && !testFinished) {
      finishTest();
    }
  }, [timeRemaining, testStarted, testFinished]);

  const startTest = () => {
    const timeLimit = testDetails?.time_limit || 15;
    setTimeRemaining(timeLimit * 60);
    setTestStarted(true);
    setTestFinished(false);
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
    
    const currentQuestionData = questions[currentQuestion];
    if (!currentQuestionData) return;
    
    let correctAnswer: number | null = null;
    
    if (typeof currentQuestionData.correctOption !== 'undefined') {
      correctAnswer = Number(currentQuestionData.correctOption);
    } else if (typeof currentQuestionData.answer !== 'undefined') {
      correctAnswer = Number(currentQuestionData.answer);
    } else if (typeof currentQuestionData.correct_answer !== 'undefined') {
      correctAnswer = Number(currentQuestionData.correct_answer);
    }
    
    if (correctAnswer === null) {
      console.error("Cannot determine correct answer for question:", currentQuestionData);
      return;
    }
    
    const isCorrect = optionIndex === correctAnswer;
    
    const updatedAnswers = [...userAnswers];
    
    const existingAnswerIndex = updatedAnswers.findIndex(
      answer => answer.questionId === currentQuestionData.id
    );
    
    if (existingAnswerIndex >= 0) {
      updatedAnswers[existingAnswerIndex] = {
        questionId: currentQuestionData.id,
        selectedOption: optionIndex,
        isCorrect: isCorrect
      };
    } else {
      updatedAnswers[currentQuestion] = {
        questionId: currentQuestionData.id,
        selectedOption: optionIndex,
        isCorrect: isCorrect
      };
    }
    
    setUserAnswers(updatedAnswers);
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      
      const previousAnswer = userAnswers[currentQuestion - 1];
      if (previousAnswer) {
        setSelectedAnswer(previousAnswer.selectedOption);
      } else {
        setSelectedAnswer(null);
      }
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      
      const nextAnswer = userAnswers[currentQuestion + 1];
      if (nextAnswer) {
        setSelectedAnswer(nextAnswer.selectedOption);
      } else {
        setSelectedAnswer(null);
      }
    } else {
      calculateScore();
      finishTest();
    }
  };

  const calculateScore = () => {
    const correctAnswers = userAnswers.filter(answer => answer && answer.isCorrect).length;
    setScore(correctAnswers);
    return correctAnswers;
  };

  const loadPublicResults = async () => {
    if (!testId) return;
    
    try {
      console.log('Loading public results for test:', testId);
      console.log('Result visibility:', testDetails?.results_visibility);
      
      // Use the test_attempts table to load results
      if (testDetails?.results_visibility === 'public') {
        const { data, error } = await supabase
          .from('test_attempts')
          .select('*')
          .eq('test_id', testId)
          .order('score', { ascending: false });
          
        if (error) {
          console.error("Error loading public results:", error);
          throw error;
        }
        
        console.log('Public results loaded:', data?.length || 0, data);
        if (data) {
          setPublicResults(data);
        }
      }
    } catch (error) {
      console.error("Error loading public results:", error);
    }
  };

  const saveTestAttempt = async (testData: any): Promise<boolean> => {
    setSaving(true);
    setSavingError(null);
    
    if (testId === 'subject' && testData.test_id === 'subject') {
      const subjectName = testData.subject || location?.state?.subject;
      if (subjectName) {
        const userIdentifier = user?.id || testTakerInfo?.email || 'anonymous';
        testData.test_id = `subject_${subjectName.replace(/\s+/g, '_').toLowerCase()}_${userIdentifier}`;
      }
    }
    
    try {
      // First, save to test_attempts table
      const { error: insertError } = await supabase
        .from('test_attempts')
        .insert([testData]);
        
      if (insertError) {
        console.error("Error saving test attempt:", insertError);
        throw insertError;
      }
      
      setSaving(false);
      return true;
    } catch (error) {
      console.error("Failed to save test results:", error);
      setSaving(false);
      setSavingError(null); // We don't show error to user
      return false;
    }
  };

  const finishTest = async () => {
    // Stop the timer by marking test as finished
    setTestFinished(true);
    
    const finalScore = calculateScore();
    
    try {
      const testData = {
        test_id: testId,
        score: finalScore,
        total_questions: questions.length,
        time_taken: (testDetails?.time_limit || 15) * 60 - timeRemaining,
        user_id: user?.id || null,
        participant_email: testTakerInfo?.email || user?.email || 'anonymous',
        participant_name: testTakerInfo?.name || user?.user_metadata?.full_name || 'Anonymous User',
        completed_at: new Date().toISOString(),
        subject: location?.state?.subject || testDetails?.subject || 'general',
      };
      
      // Determine what to display based on results_visibility setting
      const isCreator = user?.id === testDetails?.creator_id;
      
      // Save the test attempt
      await saveTestAttempt(testData);
      
      if (isCreator) {
        // Creator can always see results
        setShowResults(true);
      } else if (testDetails?.results_visibility === 'test_takers') {
        // Test takers can see their own results
        setShowResults(true);
      } else if (testDetails?.results_visibility === 'public') {
        // Everyone can see results
        setShowResults(true);
        // Load leaderboard data
        await loadPublicResults();
      } else {
        // For 'creator_only' setting, show submission complete page
        setSubmissionComplete(true);
      }
      
    } catch (error: any) {
      console.error("Error finalizing test:", error);
      
      // Still determine what to show based on visibility setting
      const isCreator = user?.id === testDetails?.creator_id;
      if (isCreator || testDetails?.results_visibility === 'test_takers' || testDetails?.results_visibility === 'public') {
        setShowResults(true);
        if (testDetails?.results_visibility === 'public') {
          await loadPublicResults();
        }
      } else {
        setSubmissionComplete(true);
      }
    }
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResults(false);
    setUserAnswers([]);
    setTimeRemaining((testDetails?.time_limit || 15) * 60);
    setTestStarted(false);
    setTestFinished(false);
    setSavingError(null);
    setSubmissionComplete(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    currentQuestion,
    selectedAnswer,
    score,
    showResults,
    timeRemaining,
    testStarted,
    userAnswers,
    reviewMode,
    submissionComplete,
    publicResults,
    saving,
    savingError,
    startTest,
    handleAnswerSelect,
    goToPreviousQuestion,
    goToNextQuestion,
    finishTest,
    resetTest,
    setReviewMode,
    formatTime,
    loadPublicResults,
  };
};
