import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ManualAiTestCreation from '@/components/cbt/ai/ManualAiTestCreation';
import DocumentBasedAiTestCreation from '@/components/cbt/ai/DocumentBasedAiTestCreation';

type TestDifficulty = "beginner" | "intermediate" | "advanced";

const AiCreateTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFilesToStorage = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async file => {
      const fileName = `${user?.id}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);
      
      if (error) throw error;
      return fileName;
    });

    return Promise.all(uploadPromises);
  };

  const handleManualTestGeneration = async (params: {
    subject: string;
    topic?: string;
    difficulty: TestDifficulty;
    questionCount: number;
    timeLimit: number;
    instructions: string;
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
        topic: params.topic,
        difficulty: params.difficulty,
        count: params.questionCount
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
      const testDescription = `AI-generated test on ${params.subject}${params.topic ? ' about ' + params.topic : ''}`;

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
          allow_retakes: params.allowRetakes,
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

  const handleDocumentBasedTestGeneration = async (params: {
    difficulty: TestDifficulty;
    questionCount: number;
    timeLimit: number;
    instructions: string;
    allowRetakes: boolean;
    resultsVisibility: string;
    uploadedFiles: File[];
  }) => {
    if (!user) {
      toast.error('Please log in to create tests');
      return;
    }

    if (params.uploadedFiles.length === 0) {
      toast.error('Please upload at least one document for auto-generation');
      return;
    }

    setLoading(true);
    try {
      let fileUrls: string[] = [];

      if (params.uploadedFiles.length > 0) {
        setUploading(true);
        fileUrls = await uploadFilesToStorage(params.uploadedFiles);
        setUploading(false);
      }

      const requestBody = {
        autoMode: true,
        difficulty: params.difficulty,
        count: params.questionCount,
        fileUrls,
        extractSubjectAndTopic: true
      };

      console.log('Generating AI test in auto mode:', requestBody);

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

      const testTitle = data.extractedSubject 
        ? `${data.extractedSubject}${data.extractedTopic ? ' - ' + data.extractedTopic : ''} Test`
        : `Test from ${params.uploadedFiles.map(f => f.name).join(', ')}`;
      
      const testDescription = `AI-generated test from uploaded documents: ${params.uploadedFiles.map(f => f.name).join(', ')}`;

      const { data: testData, error: testError } = await supabase
        .from('user_tests')
        .insert({
          title: testTitle,
          description: testDescription,
          subject: data.extractedSubject || 'General',
          difficulty: params.difficulty as TestDifficulty,
          question_count: data.questions.length,
          time_limit: params.timeLimit,
          results_visibility: params.resultsVisibility,
          allow_retakes: params.allowRetakes,
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
        subject: data.extractedSubject || 'General'
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
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create Test with AI</h1>
        <p className="text-muted-foreground">
          Choose between manual test creation or document-based automatic generation.
        </p>
      </div>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Creation</TabsTrigger>
          <TabsTrigger value="document">Document-Based</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <ManualAiTestCreation 
            onGenerateTest={handleManualTestGeneration}
            loading={loading}
          />
        </TabsContent>
        
        <TabsContent value="document">
          <DocumentBasedAiTestCreation 
            onGenerateTest={handleDocumentBasedTestGeneration}
            loading={loading}
            uploading={uploading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AiCreateTest;
