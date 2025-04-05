
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
    const timeLimit = testDetails?.time_limit || 15;
    setTimeRemaining(timeLimit * 60);
    setTestStarted(true);
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

    console.log('Current question data:', currentQuestionData);
    console.log('User selected option:', optionIndex);
    console.log('Correct answer determined as:', correctAnswer);
    
    if (correctAnswer === null) {
      console.error("Cannot determine correct answer for question:", currentQuestionData);
      return;
    }
    
    const isCorrect = optionIndex === correctAnswer;
    console.log('Is answer correct?', isCorrect);
    
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
    console.log('Final score calculation:', correctAnswers, 'correct out of', userAnswers.length);
    setScore(correctAnswers);
    return correctAnswers;
  };

  const loadPublicResults = async () => {
    if (!testId) return;
    
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('test_id', testId)
        .order('score', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setPublicResults(data);
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
    
    let attempts = 0;
    const maxAttempts = 5; 
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Saving test attempt: Attempt ${attempts} of ${maxAttempts}`);
      
      try {
        const { error: insertError } = await supabase
          .from('test_attempts')
          .insert([testData]);
          
        if (!insertError) {
          console.log(`Test results saved successfully on attempt ${attempts}`);
          return true;
        }
        
        console.error(`Error on attempt ${attempts}:`, insertError);
        
        if (attempts < maxAttempts) {
          const delay = 1000 * Math.pow(2, attempts - 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (e: any) {
        console.error(`Exception on attempt ${attempts}:`, e);
        
        if (attempts < maxAttempts) {
          const delay = 1000 * Math.pow(2, attempts - 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    const fallbackSave = await fallbackSaveAttempt(testData);
    if (fallbackSave) {
      return true;
    }
    
    const fallbackError = new Error(`Failed to save test results after ${maxAttempts} attempts`);
    console.error(fallbackError);
    setSavingError(fallbackError.message);
    return false;
  };

  const fallbackSaveAttempt = async (testData: any): Promise<boolean> => {
    try {
      console.log("Trying fallback save method...");
      
      const minimalData = {
        score: testData.score,
        total_questions: testData.total_questions,
        participant_email: testData.participant_email || 'anonymous',
        participant_name: testData.participant_name || 'Anonymous User',
        completed_at: new Date().toISOString(),
        test_id: testData.test_id === 'subject' ? null : testData.test_id
      };
      
      const { error } = await supabase
        .from('test_attempts')
        .insert([minimalData]);
      
      if (!error) {
        console.log("Test results saved successfully using fallback method");
        return true;
      }
      
      console.error("Fallback save attempt failed:", error);
      return false;
    } catch (error) {
      console.error("Error in fallback save:", error);
      return false;
    }
  };

  const finishTest = async () => {
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
      
      console.log("Preparing to save test attempt with data:", testData);
      
      setShowResults(true);
      
      saveTestAttempt(testData).then((saved) => {
        if (saved) {
          setSavingError(null);
          toast({
            title: "Test completed",
            description: "Your results have been saved successfully",
            variant: "default",
          });
        } else {
          toast({
            title: "Warning",
            description: "We're showing your results but couldn't save them to your history. Please take a screenshot if needed.",
            variant: "destructive",
          });
        }
      }).catch(error => {
        console.error("Error saving test results:", error);
        setSavingError("Could not save your results. Results are shown but may not be stored permanently.");
      });
      
      if (testDetails?.results_visibility !== 'creator_only') {
        await loadPublicResults();
      }
    } catch (error: any) {
      console.error("Error finalizing test:", error);
      setSavingError("An error occurred while finalizing your test.");
      
      setShowResults(true);
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
    setSavingError(null);
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
