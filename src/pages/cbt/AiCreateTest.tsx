import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import FeatureAccessGuard from '@/components/billing/FeatureAccessGuard';
import ManualAiTestCreation from '@/components/cbt/ai/ManualAiTestCreation';

type TestDifficulty = "beginner" | "intermediate" | "advanced";

const AiCreateTest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [testTitle, setTestTitle] = useState('');

  const handleGenerateTest = async (params: {
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
    if (!testTitle.trim()) {
      toast.error('Please enter a test title');
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to create a test');
        navigate('/auth');
        return;
      }

      console.log('Generating AI questions with params:', {
        subject: params.subject,
        topic: params.topic,
        difficulty: params.difficulty,
        count: params.questionCount,
        description: params.description
      });

      // Generate AI questions - use the correct parameter names
      const { data: questionsData, error: aiError } = await supabase.functions.invoke('generate-ai-questions', {
        body: {
          subject: params.subject,
          topic: params.topic || params.subject,
          difficulty: params.difficulty,
          count: params.questionCount,
          description: params.description
        }
      });

      if (aiError) {
        console.error('AI generation error:', aiError);
        throw aiError;
      }

      console.log('AI response:', questionsData);

      const questions = questionsData?.questions || [];
      
      if (questions.length === 0) {
        toast.error('Failed to generate questions. Please try again.');
        setLoading(false);
        return;
      }

      // Create the test
      const { data: testData, error: testError } = await supabase
        .from('user_tests')
        .insert({
          title: testTitle,
          subject: params.subject,
          creator_id: user.id,
          question_count: questions.length,
          difficulty: params.difficulty,
          time_limit: params.timeLimit,
          allow_retakes: params.allowRetakes,
          results_visibility: params.resultsVisibility,
          description: params.description || `AI-generated test on ${params.topic || params.subject}`
        })
        .select()
        .single();

      if (testError) {
        console.error('Test creation error:', testError);
        throw testError;
      }

      // Insert questions to test_questions table (consistent with manual test creation)
      const questionsToInsert = questions.map((q: any) => ({
        test_id: testData.id,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation || '',
        subject: params.subject,
        difficulty: params.difficulty
      }));

      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Questions insert error:', questionsError);
        throw questionsError;
      }

      toast.success(`Test created with ${questions.length} AI-generated questions!`);
      navigate(`/cbt/manage/${testData.id}`);
      
    } catch (error: any) {
      console.error('Error creating AI test:', error);
      toast.error(error.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/cbt')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              Create Test with AI
            </h1>
            <p className="text-muted-foreground text-sm">
              Let AI generate questions for your test
            </p>
          </div>
        </div>

        {/* Feature Access Guard for AI Test */}
        <FeatureAccessGuard featureType="ai_test">
          <div className="space-y-6">
            {/* Test Title Input */}
            <div className="bg-card rounded-lg border p-4">
              <Label htmlFor="testTitle" className="text-base font-medium">Test Title *</Label>
              <Input
                id="testTitle"
                placeholder="e.g., Physics Midterm Exam"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* AI Test Creation Component with mathematical detection */}
            <ManualAiTestCreation
              onGenerateTest={handleGenerateTest}
              loading={loading}
            />
          </div>
        </FeatureAccessGuard>
      </div>
    </div>
  );
};

export default AiCreateTest;
