import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, Loader } from 'lucide-react';

type Question = {
  id: string;
  subject: string;
  question: string;
  options: any; // Using any to match the Json type from database
  answer: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation?: string;
  created_at: string;
};

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    question: '',
    options: ['', '', '', ''],
    answer: 0,
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    explanation: ''
  });

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Geography', 
    'History', 'Literature', 'Computer Science', 'Economics'
  ];

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match our Question type
      const transformedData = (data || []).map(item => ({
        ...item,
        options: Array.isArray(item.options) ? item.options : JSON.parse(item.options as string)
      }));
      
      setQuestions(transformedData);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      question: '',
      options: ['', '', '', ''],
      answer: 0,
      difficulty: 'intermediate',
      explanation: ''
    });
    setEditingQuestion(null);
  };

  const handleCreateQuestion = async () => {
    if (!formData.subject || !formData.question || formData.options.some(opt => !opt.trim())) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const questionData = {
        subject: formData.subject,
        question: formData.question,
        options: formData.options,
        answer: formData.answer,
        difficulty: formData.difficulty,
        explanation: formData.explanation || null
      };

      let result;
      if (editingQuestion) {
        result = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id);
      } else {
        result = await supabase
          .from('questions')
          .insert([questionData]);
      }

      if (result.error) throw result.error;

      toast.success(editingQuestion ? 'Question updated successfully' : 'Question created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      subject: question.subject,
      question: question.question,
      options: Array.isArray(question.options) ? question.options : [],
      answer: question.answer,
      difficulty: question.difficulty,
      explanation: question.explanation || ''
    });
    setIsDialogOpen(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || question.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Management</h1>
          <p className="text-muted-foreground">Create and manage quiz questions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Create New Question'}</DialogTitle>
              <DialogDescription>
                {editingQuestion ? 'Update the question details' : 'Add a new question to the question bank'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({...prev, subject: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value: any) => setFormData(prev => ({...prev, difficulty: value}))}>
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
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({...prev, question: e.target.value}))}
                  placeholder="Enter the question"
                  rows={3}
                />
              </div>

              <div>
                <Label>Options</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <span className="w-8 text-sm">{String.fromCharCode(65 + index)}.</span>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...formData.options];
                        newOptions[index] = e.target.value;
                        setFormData(prev => ({...prev, options: newOptions}));
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    <Button
                      type="button"
                      variant={formData.answer === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({...prev, answer: index}))}
                    >
                      {formData.answer === index ? "Correct" : "Set as Correct"}
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData(prev => ({...prev, explanation: e.target.value}))}
                  placeholder="Explain why this answer is correct"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateQuestion}>
                {editingQuestion ? 'Update Question' : 'Create Question'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            Manage all questions in the system
          </CardDescription>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="max-w-md">
                      <div className="truncate">{question.question}</div>
                    </TableCell>
                    <TableCell>{question.subject}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        question.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                        question.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {question.difficulty}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(question.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQuestion(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQuestions;
