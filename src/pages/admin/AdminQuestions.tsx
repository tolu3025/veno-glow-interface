import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Question {
  id: string;
  subject: string;
  question: string;
  options: any;
  answer: number;
  difficulty: string;
  explanation?: string;
  topic?: string;
  semester?: string;
}

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Form state
  const [newQuestion, setNewQuestion] = useState({
    subject: '',
    question: '',
    options: ['', '', '', ''],
    answer: 0,
    difficulty: 'intermediate',
    explanation: '',
    topic: '',
    semester: 'first'
  });

  // AI Generation state
  const [aiSubject, setAiSubject] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('intermediate');
  const [aiCount, setAiCount] = useState(5);

  // Filters
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  useEffect(() => {
    fetchQuestions();
    fetchSubjects();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('subject')
        .order('subject');

      if (error) throw error;
      const uniqueSubjects = [...new Set((data || []).map(item => item.subject))];
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleAddQuestion = async () => {
    try {
      const { error } = await supabase
        .from('questions')
        .insert([{
          subject: newQuestion.subject,
          question: newQuestion.question,
          options: newQuestion.options,
          answer: newQuestion.answer,
          difficulty: newQuestion.difficulty as 'beginner' | 'intermediate' | 'advanced',
          explanation: newQuestion.explanation || null,
          topic: newQuestion.topic || null,
          semester: newQuestion.semester
        }]);

      if (error) throw error;

      toast.success('Question added successfully');
      setIsAddingQuestion(false);
      setNewQuestion({
        subject: '',
        question: '',
        options: ['', '', '', ''],
        answer: 0,
        difficulty: 'intermediate',
        explanation: '',
        topic: '',
        semester: 'first'
      });
      fetchQuestions();
      fetchSubjects();
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Failed to add question');
    }
  };

  const handleEditQuestion = async () => {
    if (!editingQuestion) return;

    try {
      const { error } = await supabase
        .from('questions')
        .update({
          subject: editingQuestion.subject,
          question: editingQuestion.question,
          options: editingQuestion.options,
          answer: editingQuestion.answer,
          difficulty: editingQuestion.difficulty as 'beginner' | 'intermediate' | 'advanced',
          explanation: editingQuestion.explanation || null,
          topic: editingQuestion.topic || null,
          semester: editingQuestion.semester
        })
        .eq('id', editingQuestion.id);

      if (error) throw error;

      toast.success('Question updated successfully');
      setEditingQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const generateAIQuestions = async () => {
    setGeneratingQuestions(true);
    try {
      console.log('Generating AI questions with:', {
        subject: aiSubject,
        topic: aiTopic,
        difficulty: aiDifficulty,
        count: aiCount
      });

      const { data, error } = await supabase.functions.invoke('generate-ai-questions', {
        body: {
          subject: aiSubject,
          topic: aiTopic,
          difficulty: aiDifficulty,
          count: aiCount
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.questions || !Array.isArray(data.questions)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from AI service');
      }

      // Insert the generated questions
      const questionsToInsert = data.questions.map((q: any) => ({
        subject: aiSubject,
        question: q.question,
        options: q.options,
        answer: q.answer,
        difficulty: aiDifficulty as 'beginner' | 'intermediate' | 'advanced',
        explanation: q.explanation,
        topic: aiTopic || null,
        semester: 'first'
      }));

      const { error: insertError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (insertError) throw insertError;

      toast.success(`Successfully generated and added ${data.questions.length} questions!`);
      fetchQuestions();
      fetchSubjects();
      
      // Reset form
      setAiSubject('');
      setAiTopic('');
      setAiDifficulty('intermediate');
      setAiCount(5);
    } catch (error) {
      console.error('Error generating AI questions:', error);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (filterSubject !== 'all' && q.subject !== filterSubject) return false;
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false;
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading questions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Question Management</h1>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Wand2 className="h-4 w-4 mr-2" />
                Generate AI Questions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Generate AI Questions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    placeholder="e.g., Mathematics, Biology"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Topic (optional)</label>
                  <Input
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g., Algebra, Cell Biology"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Number of Questions</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={aiCount}
                    onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                  />
                </div>
                <Button 
                  onClick={generateAIQuestions} 
                  disabled={!aiSubject || generatingQuestions}
                  className="w-full"
                >
                  {generatingQuestions ? 'Generating...' : 'Generate Questions'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={() => setIsAddingQuestion(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulties</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Questions List */}
      <div className="grid gap-4">
        {filteredQuestions.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{question.question}</CardTitle>
                  <CardDescription>
                    Subject: {question.subject} | Difficulty: {question.difficulty}
                    {question.topic && ` | Topic: ${question.topic}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingQuestion(question)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Question</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this question? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteQuestion(question.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.isArray(question.options) ? 
                  question.options.map((option: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant={index === question.answer ? "default" : "secondary"}>
                        {String.fromCharCode(65 + index)}
                      </Badge>
                      <span>{option}</span>
                      {index === question.answer && (
                        <Badge variant="default" className="ml-auto">Correct</Badge>
                      )}
                    </div>
                  )) : (
                    <p>Invalid options format</p>
                  )
                }
                {question.explanation && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Question Dialog */}
      <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={newQuestion.subject}
                  onChange={(e) => setNewQuestion({...newQuestion, subject: e.target.value})}
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={newQuestion.difficulty} onValueChange={(value) => setNewQuestion({...newQuestion, difficulty: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Question</label>
              <Textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                placeholder="Enter the question"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Options</label>
              {newQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2 mt-2">
                  <Badge variant={index === newQuestion.answer ? "default" : "secondary"}>
                    {String.fromCharCode(65 + index)}
                  </Badge>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...newQuestion.options];
                      newOptions[index] = e.target.value;
                      setNewQuestion({...newQuestion, options: newOptions});
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                  <Button
                    type="button"
                    variant={index === newQuestion.answer ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewQuestion({...newQuestion, answer: index})}
                  >
                    Correct
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium">Explanation (Optional)</label>
              <Textarea
                value={newQuestion.explanation}
                onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                placeholder="Explain why this is the correct answer"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingQuestion(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddQuestion}>
                Add Question
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={editingQuestion.subject}
                    onChange={(e) => setEditingQuestion({...editingQuestion, subject: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select value={editingQuestion.difficulty} onValueChange={(value) => setEditingQuestion({...editingQuestion, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Question</label>
                <Textarea
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Options</label>
                {Array.isArray(editingQuestion.options) && editingQuestion.options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 mt-2">
                    <Badge variant={index === editingQuestion.answer ? "default" : "secondary"}>
                      {String.fromCharCode(65 + index)}
                    </Badge>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editingQuestion.options];
                        newOptions[index] = e.target.value;
                        setEditingQuestion({...editingQuestion, options: newOptions});
                      }}
                    />
                    <Button
                      type="button"
                      variant={index === editingQuestion.answer ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEditingQuestion({...editingQuestion, answer: index})}
                    >
                      Correct
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium">Explanation (Optional)</label>
                <Textarea
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditQuestion}>
                  Update Question
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminQuestions;
