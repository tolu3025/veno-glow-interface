
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

type QuizQuestion = {
  id: string;
  text?: string;
  question?: string;
  options: string[];
  correctOption?: number;
  answer?: number;
  explanation?: string;
};

type TestDetails = {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  time_limit: number | null;
  results_visibility: 'creator_only' | 'test_takers' | 'public';
  allow_retakes: boolean;
  share_code?: string;
};

export const useUserTest = (testId: string) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<number>(0);
  const [shareCodeRequired, setShareCodeRequired] = useState(false);
  const [shareCodeError, setShareCodeError] = useState<string | null>(null);

  // Function to check previous attempts by email for unregistered users
  const checkPreviousAttemptsByEmail = async (email: string): Promise<number> => {
    if (!testDetails || testDetails.allow_retakes) return 0;
    
    try {
      const { data: attempts, error } = await supabase
        .from('test_attempts')
        .select('*', { count: 'exact' })
        .eq('test_id', testId)
        .eq('participant_email', email);
        
      if (error) {
        console.error('Error checking previous attempts:', error);
        return 0;
      }
      
      return attempts?.length || 0;
    } catch (error) {
      console.error('Error checking previous attempts:', error);
      return 0;
    }
  };

  useEffect(() => {
    const loadTest = async () => {
      if (!testId || testId === 'subject') return;
      
      setLoading(true);
      try {
        console.log(`Loading test with ID: ${testId}`);
        
        // Try to load test - this should work for both authenticated and unauthenticated users
        // due to the updated RLS policies
        const { data: testData, error: testError } = await supabase
          .from('user_tests')
          .select('*')
          .eq('id', testId)
          .single();
          
        if (testError) {
          console.error("Error fetching test data:", testError);
          
          // If it's a test accessed by share code and user is not authenticated,
          // don't throw error, just show that test is not found
          if (testError.code === 'PGRST116') {
            toast.error("Test not found or access denied");
            navigate('/');
            return;
          }
          throw testError;
        }
        
        if (!testData) {
          toast.error("Test not found");
          navigate('/');
          return;
        }
        
        console.log("Test details loaded:", testData);
        setTestDetails(testData as TestDetails);
        
        setShareCodeRequired(!!testData.share_code);
        
        // Check previous attempts for both logged-in and unregistered users
        if (testData.allow_retakes === false) {
          if (user) {
            // For logged-in users, check by user_id
            const { data: attempts, error: attemptsError } = await supabase
              .from('test_attempts')
              .select('*', { count: 'exact' })
              .eq('test_id', testId)
              .eq('user_id', user.id);
              
            if (!attemptsError && attempts && attempts.length > 0) {
              setPreviousAttempts(attempts.length);
            }
          }
          // For unregistered users, we'll check by email when they provide it in the form
        }
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('user_test_questions')
          .select('*')
          .eq('test_id', testId);
          
        if (questionsError) {
          console.error("Error fetching questions:", questionsError);
          throw questionsError;
        }
        
        if (questionsData && questionsData.length > 0) {
          console.log("Raw questions data:", questionsData);
          
          const formattedQuestions: QuizQuestion[] = questionsData.map(q => ({
            id: q.id,
            text: q.question_text,
            question: q.question_text,
            options: Array.isArray(q.options) ? q.options.map(opt => String(opt)) : [],
            correctOption: q.answer,
            answer: q.answer,
            explanation: q.explanation
          }));
          
          console.log("Formatted questions:", formattedQuestions);
          setQuestions(formattedQuestions);
        } else {
          console.warn("No questions found for test ID:", testId);
          toast.error("No questions available for this test");
        }
      } catch (error) {
        console.error("Error loading test:", error);
        toast.error("Failed to load test");
        // Don't navigate away for unregistered users - let them try again
        if (user) {
          navigate('/cbt');
        }
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, user, navigate]);

  return {
    questions,
    testDetails,
    loading,
    previousAttempts,
    shareCodeRequired,
    shareCodeError,
    setShareCodeError,
    checkPreviousAttemptsByEmail,
    setPreviousAttempts
  };
};
