
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface TestData {
  id: string;
  title: string;
  description?: string;
  subject: string;
  difficulty: string;
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
      setQuestions(data || []);
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
      const { error } = await supabase
        .from('user_tests')
        .update(updates)
        .eq('id', testId);

      if (error) throw error;
      
      setTest(prev => prev ? { ...prev, ...updates } : null);
      
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
    handleEditQuestion,
    handleDeleteQuestion,
    copyShareLink,
    updateTest,
    fetchTestQuestions,
    fetchParticipants,
  };
};
