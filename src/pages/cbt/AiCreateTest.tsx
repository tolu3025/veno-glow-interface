
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import ManualAiTestCreation from '@/components/cbt/ai/ManualAiTestCreation';

type TestDifficulty = "beginner" | "intermediate" | "advanced";

const AiCreateTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleManualTestGeneration = async (params: {
    subject: string;
    topic?: string;
    difficulty: TestDifficulty;
    questionCount: number;
    timeLimit: number;
    instructions: string;
    description: string;
    allowRetakes: boolean;
    resultsVisibility: string;
  }) => {
    if (!user) {
      toast.error('Please log in to create tests');
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        subject: params.subject,
        topic: params.topic || undefined,
        difficulty: params.difficulty,
        count: params.questionCount,
        description: params.description
      };

      console.log('Generating AI test in manual mode:', requestBody);

      const { data, error } = await supabase.functions.invoke('generate-ai-questions', {
        body: requestBody
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        console.error('Invalid response data:', data);
        throw new Error('No questions were generated. Please try again with different content.');
      }

      const testTitle = `${params.subject} ${params.topic ? '- ' + params.topic : ''} Test`;
      const testDescription = params.description || `AI-generated test on ${params.subject}${params.topic ? ' about ' + params.topic : ''}`;

      const { data: testData, error: testError } = await supabase
        .from('user_tests')
        .insert({
          title: testTitle,
          description: testDescription,
          subject: params.subject,
          difficulty: params.difficulty as TestDifficulty,
          question_count: data.questions.length,
          time_limit: params.timeLimit,
          results_visibility: params.resultsVisibility,
          allow_retakes: params.allowRetakes || false,
          creator_id: user.id
        })
        .select()
        .single();

      if (testError) {
        console.error('Test creation error:', testError);
        throw testError;
      }

      const questionsToInsert = data.questions.map((q: any) => ({
        test_id: testData.id,
        question_text: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        subject: params.subject
      }));

      const { error: questionError } = await supabase
        .from('user_test_questions')
        .insert(questionsToInsert);

      if (questionError) {
        console.error('Question insertion error:', questionError);
        throw questionError;
      }

      toast.success(`Test created successfully with ${data.questions.length} questions!`);
      navigate(`/cbt/manage/${testData.id}`);
    } catch (error) {
      console.error('Error creating test:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create test. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create Test with AI</h1>
        <p className="text-muted-foreground">
          Specify your subject and topic to generate AI-powered test questions with detailed explanations.
        </p>
      </div>

      <ManualAiTestCreation 
        onGenerateTest={handleManualTestGeneration}
        loading={loading}
      />
    </div>
  );
};

export default AiCreateTest;
