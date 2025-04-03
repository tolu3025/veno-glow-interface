
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
    
    // FIXED: Enhanced correct answer checking to handle different property names and formats
    let correctAnswer: number | null = null;
    
    // Try all possible property names and formats
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
    
    // Check if the selected option matches the correct answer
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
    // Recalculate score based on correct answers
    const correctAnswers = userAnswers.filter(answer => answer && answer.isCorrect).length;
    console.log('Final score calculation:', correctAnswers, 'correct out of', userAnswers.length);
    setScore(correctAnswers);
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

  const finishTest = async () => {
    calculateScore();
    
    try {
      const testData = {
        test_id: testId,
        score: score,
        total_questions: questions.length,
        time_taken: (testDetails?.time_limit || 15) * 60 - timeRemaining,
        user_id: user?.id || null,
        participant_email: testTakerInfo?.email || user?.email || '',
        participant_name: testTakerInfo?.name || user?.user_metadata?.full_name || '',
        completed_at: new Date().toISOString(),
      };
      
      const { error } = await supabase.from('test_attempts').insert([testData]);
      
      if (error) throw error;
      
      // Fix for visibility issue - load results regardless of visibility setting
      await loadPublicResults();
      
      if (testDetails?.results_visibility === 'creator_only') {
        setSubmissionComplete(true);
      } else {
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error saving test results:", error);
      toast({
        title: "Error",
        description: "Could not save your results",
        variant: "destructive",
      });
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
