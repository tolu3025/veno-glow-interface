import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

// Define the allowed difficulty values as a union type
type TestDifficulty = "beginner" | "intermediate" | "advanced";

interface TestData {
  id: string;
  title: string;
  description?: string;
  subject: string;
  difficulty: TestDifficulty; // Use the union type here
  question_count: number;
  time_limit?: number;
  results_visibility: string;
  allow_retakes: boolean;
  share_code?: string;
  created_at: string;
  updated_at: string;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  answer: number;
  explanation?: string;
  subject: string;
}

interface Participant {
  id: string;
  participant_name?: string;
  participant_email: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export const useTestManagement = (testId: string) => {
  const [test, setTest] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  
  // Test execution state
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [publicResults, setPublicResults] = useState<any[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTestData = async () => {
    if (!testId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) throw error;
      setTest(data);
    } catch (error) {
      console.error('Error fetching test:', error);
      toast({
        title: "Error",
        description: "Failed to load test data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTestQuestions = async () => {
    if (!testId) return;
    
    setLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from('user_test_questions')
        .select('*')
        .eq('test_id', testId);

      if (error) throw error;
      
      // Transform the data to match our Question interface
      const transformedQuestions: Question[] = (data || []).map(q => ({
        id: q.id,
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options.map(opt => String(opt)) : [],
        answer: q.answer,
        explanation: q.explanation,
        subject: q.subject || ''
      }));
      
      setQuestions(transformedQuestions);
      setUserAnswers(new Array(transformedQuestions.length).fill(null));
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchParticipants = async () => {
    if (!testId) return;
    
    setLoadingParticipants(true);
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('test_id', testId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast({
        title: "Error",
        description: "Failed to load participants",
        variant: "destructive",
      });
    } finally {
      setLoadingParticipants(false);
    }
  };

  const startTest = () => {
    setTestStarted(true);
    if (test?.time_limit) {
      setTimeRemaining(test.time_limit * 60); // Convert minutes to seconds
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
      // Finish test
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
    setSaving(true);
    setSavingError(null);
    
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
      setSubmissionComplete(true);
      
      // Save test attempt if user is authenticated
      if (user && testId !== 'subject') {
        await supabase
          .from('test_attempts')
          .insert({
            test_id: testId,
            user_id: user.id,
            score: finalScore,
            total_questions: questions.length,
            participant_email: user.email,
            completed_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error saving test results:', error);
      setSavingError('Failed to save test results');
    } finally {
      setSaving(false);
    }
  };

  const resetTest = () => {
    setTestStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setUserAnswers(new Array(questions.length).fill(null));
    setShowResults(false);
    setReviewMode(false);
    setSubmissionComplete(false);
    setScore(0);
    if (test?.time_limit) {
      setTimeRemaining(test.time_limit * 60);
    }
  };

  const loadPublicResults = async () => {
    try {
      const { data, error } = await supabase
        .from('participant_results')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPublicResults(data || []);
    } catch (error) {
      console.error('Error loading public results:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEditQuestion = async (updatedQuestion: Question) => {
    try {
      const { error } = await supabase
        .from('user_test_questions')
        .update({
          question_text: updatedQuestion.question_text,
          options: updatedQuestion.options,
          answer: updatedQuestion.answer,
          explanation: updatedQuestion.explanation,
        })
        .eq('id', updatedQuestion.id);

      if (error) throw error;
      
      await fetchTestQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('user_test_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      
      // Update question count in test
      if (test) {
        const newQuestionCount = test.question_count - 1;
        await supabase
          .from('user_tests')
          .update({ question_count: newQuestionCount })
          .eq('id', testId);
        
        setTest(prev => prev ? { ...prev, question_count: newQuestionCount } : null);
      }
      
      await fetchTestQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  };

  const generateShareCode = async () => {
    if (!test) return;
    
    try {
      const shareCode = Math.random().toString(36).substring(2, 15);
      
      const { error } = await supabase
        .from('user_tests')
        .update({ share_code: shareCode })
        .eq('id', testId);

      if (error) throw error;
      
      setTest(prev => prev ? { ...prev, share_code: shareCode } : null);
      return shareCode;
    } catch (error) {
      console.error('Error generating share code:', error);
      throw error;
    }
  };

  const copyShareLink = async () => {
    try {
      let shareCode = test?.share_code;
      
      if (!shareCode) {
        shareCode = await generateShareCode();
      }
      
      // Create the full URL for sharing
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/cbt/take-test/${shareCode}`;
      
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Share link copied!",
        description: "The test link has been copied to your clipboard",
      });
    } catch (error) {
      console.error('Error copying share link:', error);
      toast({
        title: "Error",
        description: "Failed to copy share link",
        variant: "destructive",
      });
    }
  };

  const updateTest = async (updates: Partial<TestData>) => {
    if (!test) return;
    
    try {
      // Create a type-safe updates object
      const sanitizedUpdates: Record<string, any> = { ...updates };
      
      // Ensure difficulty is one of the allowed values if it's being updated
      if (updates.difficulty && !["beginner", "intermediate", "advanced"].includes(updates.difficulty as string)) {
        // Default to intermediate if an invalid difficulty is provided
        sanitizedUpdates.difficulty = "intermediate";
      }
      
      const { error } = await supabase
        .from('user_tests')
        .update(sanitizedUpdates)
        .eq('id', testId);

      if (error) throw error;
      
      // Update the local state with proper typing
      setTest(prev => prev ? { ...prev, ...sanitizedUpdates } as TestData : null);
      
      toast({
        title: "Test updated",
        description: "Test settings have been saved successfully",
      });
    } catch (error) {
      console.error('Error updating test:', error);
      toast({
        title: "Error",
        description: "Failed to update test",
        variant: "destructive",
      });
    }
  };

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

  useEffect(() => {
    if (testId && user) {
      fetchTestData();
      fetchTestQuestions();
      fetchParticipants();
    }
  }, [testId, user]);

  return {
    test,
    questions,
    participants,
    loading,
    loadingQuestions,
    loadingParticipants,
    testStarted,
    currentQuestion,
    selectedAnswer,
    userAnswers,
    timeRemaining,
    showResults,
    reviewMode,
    submissionComplete,
    score,
    saving,
    savingError,
    publicResults,
    handleEditQuestion,
    handleDeleteQuestion,
    copyShareLink,
    updateTest,
    fetchTestQuestions,
    fetchParticipants,
    startTest,
    handleAnswerSelect,
    goToNextQuestion,
    goToPreviousQuestion,
    finishTest,
    resetTest,
    loadPublicResults,
    formatTime,
    setReviewMode,
  };
};
