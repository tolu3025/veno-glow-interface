import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSubjects } from '@/hooks/useSubjects';
import { toast } from 'sonner';
import { BookOpen, Plus, Loader2 } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
  difficulty: string;
  explanation?: string;
  subject: string;
}

interface QuestionBankSelectorProps {
  testId: string;
  onQuestionsSelected: (questions: Question[]) => void;
  existingQuestionIds?: string[];
}

const QuestionBankSelector: React.FC<QuestionBankSelectorProps> = ({
  testId,
  onQuestionsSelected,
  existingQuestionIds = []
}) => {
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Fetch questions when subject or difficulty changes
  useEffect(() => {
    if (selectedSubject) {
      fetchQuestions();
    }
  }, [selectedSubject, selectedDifficulty]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('subject', selectedSubject)
        .not('id', 'in', `(${existingQuestionIds.join(',')})`)
        .order('created_at', { ascending: false });

      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty', selectedDifficulty as 'beginner' | 'intermediate' | 'advanced');
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setQuestions((data || []).map(q => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options as string[] : [],
        answer: q.answer,
        difficulty: q.difficulty || 'intermediate',
        explanation: q.explanation || '',
        subject: q.subject
      })));
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionToggle = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions(prev => [...prev, questionId]);
    } else {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  const handleAddQuestions = async () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    setAdding(true);
    try {
      const questionsToAdd = questions.filter(q => selectedQuestions.includes(q.id));
      
      // Add questions to test_questions table
      const testQuestions = questionsToAdd.map(q => ({
        test_id: testId,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        subject: q.subject
      }));

      const { error } = await supabase
        .from('test_questions')
        .insert(testQuestions);

      if (error) throw error;

      // Update test question count
      const { error: updateError } = await supabase
        .from('user_tests')
        .update({ 
          question_count: existingQuestionIds.length + selectedQuestions.length 
        })
        .eq('id', testId);

      if (updateError) throw updateError;

      toast.success(`${selectedQuestions.length} questions added to test`);
      onQuestionsSelected(questionsToAdd);
      setSelectedQuestions([]);
      
      // Refresh questions list to exclude newly added ones
      if (selectedSubject) {
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error adding questions:', error);
      toast.error('Failed to add questions to test');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Select from Question Bank
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Subject</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.name} value={subject.name}>
                    {subject.name} ({subject.question_count} questions)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Difficulty</Label>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedSubject && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading questions...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="selectAll"
                      checked={selectedQuestions.length === questions.length && questions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="selectAll">
                      Select All ({questions.length} questions)
                    </Label>
                  </div>
                  <Badge variant="outline">
                    {selectedQuestions.length} selected
                  </Badge>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                  {questions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No questions available for the selected criteria
                    </p>
                  ) : (
                    questions.map((question) => (
                      <div key={question.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Checkbox
                          id={question.id}
                          checked={selectedQuestions.includes(question.id)}
                          onCheckedChange={(checked: boolean) => handleQuestionToggle(question.id, checked)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">
                            {question.question}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {question.difficulty}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {question.options.length} options
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedQuestions.length > 0 && (
                  <Button 
                    onClick={handleAddQuestions}
                    disabled={adding}
                    className="w-full"
                  >
                    {adding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Questions...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add {selectedQuestions.length} Question{selectedQuestions.length > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionBankSelector;