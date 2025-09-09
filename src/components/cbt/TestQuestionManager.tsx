import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen, PlusCircle, List, Loader2, RefreshCw } from 'lucide-react';
import QuestionBankSelector from './QuestionBankSelector';
import ManualQuestionEntry from './ManualQuestionEntry';

interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  difficulty: string;
  subject: string;
  explanation?: string;
}

interface TestQuestionManagerProps {
  testId: string;
  onQuestionsUpdated?: () => void;
}

const TestQuestionManager: React.FC<TestQuestionManagerProps> = ({
  testId,
  onQuestionsUpdated
}) => {
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [testId]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', testId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setQuestions((data || []).map(q => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options as string[] : [],
        answer: q.answer,
        difficulty: q.difficulty || 'intermediate',
        subject: q.subject || '',
        explanation: q.explanation || ''
      })));
    } catch (error) {
      console.error('Error fetching test questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQuestions();
    setRefreshing(false);
    if (onQuestionsUpdated) {
      onQuestionsUpdated();
    }
  };

  const handleQuestionAdded = () => {
    fetchQuestions();
    if (onQuestionsUpdated) {
      onQuestionsUpdated();
    }
    setActiveTab('list');
  };

  const handleQuestionsSelected = () => {
    fetchQuestions();
    if (onQuestionsUpdated) {
      onQuestionsUpdated();
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('test_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      // Update test question count
      const { error: updateError } = await supabase
        .from('user_tests')
        .update({ 
          question_count: questions.length - 1 
        })
        .eq('id', testId);

      if (updateError) throw updateError;

      toast.success('Question deleted successfully');
      fetchQuestions();
      if (onQuestionsUpdated) {
        onQuestionsUpdated();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading questions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Test Questions</h2>
          <Badge variant="outline">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Questions ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Manually
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            From Question Bank
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No questions added yet. Start by adding questions manually or from the question bank.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('manual')}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Manually
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('bank')}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      From Question Bank
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <Badge variant="outline">{question.difficulty}</Badge>
                          <Badge variant="outline">{question.subject}</Badge>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteQuestion(question.id)}
                        >
                          Delete
                        </Button>
                      </div>
                      
                      <p className="font-medium mb-2">{question.question}</p>
                      
                      <div className="space-y-1">
                        {question.options.map((option, optionIndex) => (
                          <div 
                            key={optionIndex} 
                            className={`p-2 rounded text-sm ${
                              optionIndex === question.answer 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-gray-50'
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option}
                            {optionIndex === question.answer && (
                              <span className="ml-2 text-xs">(Correct)</span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {question.explanation && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <strong>Explanation:</strong> {question.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <ManualQuestionEntry
            testId={testId}
            onQuestionAdded={handleQuestionAdded}
          />
        </TabsContent>

        <TabsContent value="bank">
          <QuestionBankSelector
            testId={testId}
            onQuestionsSelected={handleQuestionsSelected}
            existingQuestionIds={questions.map(q => q.id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestQuestionManager;