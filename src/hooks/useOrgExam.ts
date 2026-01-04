import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type OrgExamRow = Database['public']['Tables']['organization_exams']['Row'];
type OrgExamInsert = Database['public']['Tables']['organization_exams']['Insert'];
type OrgExamUpdate = Database['public']['Tables']['organization_exams']['Update'];
type OrgExamSessionRow = Database['public']['Tables']['organization_exam_sessions']['Row'];
type OrgExamSessionInsert = Database['public']['Tables']['organization_exam_sessions']['Insert'];
type OrgExamQuestionRow = Database['public']['Tables']['organization_exam_questions']['Row'];

export interface Organization {
  id: string;
  name: string;
  type: 'school' | 'university' | 'exam_center' | 'training_institute';
  admin_user_id: string;
  logo_url?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
}

export interface OrgExam extends OrgExamRow {}

export interface OrgExamQuestion {
  id: string;
  exam_id: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
  order_index: number;
}

export interface OrgExamSession extends OrgExamSessionRow {}

export function useOrgExam() {
  const { user } = useAuth();
  const [exams, setExams] = useState<OrgExam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_exams')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const createExam = async (examData: Omit<OrgExamInsert, 'created_by'>): Promise<OrgExam | null> => {
    if (!user) {
      toast.error('You must be logged in to create an exam');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('organization_exams')
        .insert({
          ...examData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setExams(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('Failed to create exam');
      return null;
    }
  };

  const updateExam = async (examId: string, updates: OrgExamUpdate): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organization_exams')
        .update(updates)
        .eq('id', examId);

      if (error) throw error;
      
      setExams(prev => prev.map(e => e.id === examId ? { ...e, ...updates } as OrgExam : e));
      return true;
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error('Failed to update exam');
      return false;
    }
  };

  const deleteExam = async (examId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organization_exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;
      
      setExams(prev => prev.filter(e => e.id !== examId));
      toast.success('Exam deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
      return false;
    }
  };

  const getExamByAccessCode = async (accessCode: string): Promise<OrgExam | null> => {
    try {
      const { data, error } = await supabase
        .from('organization_exams')
        .select('*')
        .eq('access_code', accessCode.toUpperCase())
        .in('status', ['draft', 'scheduled', 'active'])
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching exam by access code:', error);
      return null;
    }
  };

  const getExamById = async (examId: string): Promise<OrgExam | null> => {
    try {
      const { data, error } = await supabase
        .from('organization_exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching exam:', error);
      return null;
    }
  };

  const getExamQuestions = async (examId: string): Promise<OrgExamQuestion[]> => {
    try {
      const { data, error } = await supabase
        .from('organization_exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      if (error) throw error;
      
      // Parse options if they're stored as JSON strings
      return (data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : []),
        explanation: q.explanation || undefined,
      })) as OrgExamQuestion[];
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  };

  const saveQuestions = async (examId: string, questions: Omit<OrgExamQuestion, 'id' | 'exam_id'>[]): Promise<boolean> => {
    try {
      // Delete existing questions
      await supabase
        .from('organization_exam_questions')
        .delete()
        .eq('exam_id', examId);

      // Insert new questions
      const { error } = await supabase
        .from('organization_exam_questions')
        .insert(
          questions.map((q, index) => ({
            exam_id: examId,
            question: q.question,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation || null,
            order_index: index,
          }))
        );

      if (error) throw error;
      
      // Update question count
      await supabase
        .from('organization_exams')
        .update({ question_count: questions.length })
        .eq('id', examId);

      return true;
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('Failed to save questions');
      return false;
    }
  };

  const getExamSessions = async (examId: string): Promise<OrgExamSession[]> => {
    try {
      const { data, error } = await supabase
        .from('organization_exam_sessions')
        .select('*')
        .eq('exam_id', examId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  };

  const createSession = async (sessionData: OrgExamSessionInsert): Promise<OrgExamSession | null> => {
    try {
      const { data, error } = await supabase
        .from('organization_exam_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You have already registered for this exam');
      } else {
        console.error('Error creating session:', error);
        toast.error('Failed to register for exam');
      }
      return null;
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<OrgExamSession>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organization_exam_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating session:', error);
      return false;
    }
  };

  const getSessionByEmail = async (examId: string, email: string): Promise<OrgExamSession | null> => {
    try {
      const { data, error } = await supabase
        .from('organization_exam_sessions')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching session:', error);
      return null;
    }
  };

  const generateQuestions = async (params: {
    subject: string;
    academicLevel: string;
    curriculumType: string;
    questionCount: number;
    difficulty: string;
    topic?: string;
  }): Promise<OrgExamQuestion[] | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-organization-exam', {
        body: params,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data.questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions');
      return null;
    }
  };

  return {
    exams,
    loading,
    fetchExams,
    createExam,
    updateExam,
    deleteExam,
    getExamByAccessCode,
    getExamById,
    getExamQuestions,
    saveQuestions,
    getExamSessions,
    createSession,
    updateSession,
    getSessionByEmail,
    generateQuestions,
  };
}
