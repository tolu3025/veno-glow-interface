
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

  useEffect(() => {
    const loadTest = async () => {
      if (!testId || testId === 'subject') return;
      
      setLoading(true);
      try {
        console.log(`Loading test with ID: ${testId}`, 'User:', user?.email || 'No user (public access)');
        
        // Load test details - now works for both authenticated and unauthenticated users
        const { data: testData, error: testError } = await supabase
          .from('user_tests')
          .select('*')
          .eq('id', testId)
          .single();
          
        if (testError) {
          console.error("Error fetching test data:", testError);
          
          if (testError.code === 'PGRST116') {
            toast.error("Test not found or access denied");
            navigate('/cbt');
            return;
          }
          throw testError;
        }
        
        if (!testData) {
          toast.error("Test not found");
          navigate('/cbt');
          return;
        }
        
        console.log("Test details loaded:", testData);
        setTestDetails(testData as TestDetails);
        
        setShareCodeRequired(!!testData.share_code);
        
        // Check previous attempts only for authenticated users and if retakes are not allowed
        if (testData.allow_retakes === false && user) {
          const { data: attempts, error: attemptsError } = await supabase
            .from('test_attempts')
            .select('*', { count: 'exact' })
            .eq('test_id', testId)
            .eq('user_id', user.id);
            
          if (!attemptsError && attempts && attempts.length > 0) {
            setPreviousAttempts(attempts.length);
          }
        }
        
        // Load questions from test_questions table first
        let questionsData: any[] = [];
        
        const { data: testQuestionsData, error: testQuestionsError } = await supabase
          .from('test_questions')
          .select('*')
          .eq('test_id', testId);
          
        if (testQuestionsError) {
          console.error("Error fetching from test_questions:", testQuestionsError);
        }
        
        if (testQuestionsData && testQuestionsData.length > 0) {
          questionsData = testQuestionsData;
          console.log("Found questions in test_questions:", testQuestionsData.length);
        } else {
          // Fallback to user_test_questions if no questions found
          console.log("No questions in test_questions, checking user_test_questions...");
          const { data: userTestQuestionsData, error: userTestQuestionsError } = await supabase
            .from('user_test_questions')
            .select('*')
            .eq('test_id', testId);
            
          if (userTestQuestionsError) {
            console.error("Error fetching from user_test_questions:", userTestQuestionsError);
          }
          
          if (userTestQuestionsData && userTestQuestionsData.length > 0) {
            // Map user_test_questions format to match expected format
            questionsData = userTestQuestionsData.map(q => ({
              id: q.id,
              question: q.question_text,
              options: q.options,
              answer: q.answer,
              explanation: q.explanation,
              subject: q.subject
            }));
            console.log("Found questions in user_test_questions:", userTestQuestionsData.length);
          }
        }
        
        if (questionsData.length > 0) {
          console.log("Raw questions data:", questionsData);
          
          const formattedQuestions: QuizQuestion[] = questionsData.map(q => ({
            id: q.id,
            text: q.question,
            question: q.question,
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
        navigate('/cbt');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, user, navigate]);

  const checkPreviousAttemptsByEmail = async (email: string): Promise<number> => {
    if (!testDetails) return 0;
    
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
