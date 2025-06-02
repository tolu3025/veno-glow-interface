
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
import { Plus, Edit, Trash2, Search, Loader, BookOpen, Filter, Save, X } from 'lucide-react';

type Question = {
  id: string;
  subject: string;
  question: string;
  options: any;
  answer: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation?: string;
  created_at: string;
};

type Subject = {
  name: string;
  question_count: number;
};

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingNewSubject, setIsAddingNewSubject] = useState(false);
  const [editingSubjectName, setEditingSubjectName] = useState<string>("");
  
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    question: '',
    options: ['', '', '', ''],
    answer: 0,
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    explanation: ''
  });

  useEffect(() => {
    fetchQuestions();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    try {
      console.log('Fetching subjects...');
      const { data, error } = await supabase
        .from('questions')
        .select('subject')
        .order('subject');
      
      if (error) {
        console.error('Error fetching subjects:', error);
        throw error;
      }
      
      console.log('Raw subject data:', data);
      
      // Get unique subjects and count questions
      const subjectCounts = (data || []).reduce((acc: Record<string, number>, item) => {
        if (item.subject && item.subject.trim()) {
          acc[item.subject] = (acc[item.subject] || 0) + 1;
        }
        return acc;
      }, {});
      
      const subjectList = Object.entries(subjectCounts).map(([name, count]) => ({
        name,
        question_count: count
      }));
      
      console.log('Processed subjects:', subjectList);
      setSubjects(subjectList);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      console.log('Fetching questions...');
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching questions:', error);
        throw error;
      }
      
      console.log('Questions data:', data);
      
      const transformedData = (data || []).map(item => ({
        ...item,
        options: Array.isArray(item.options) ? item.options : JSON.parse(item.options as string)
      }));
      
      setQuestions(transformedData);
      toast.success(`Loaded ${transformedData.length} questions`);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error(`Failed to fetch questions: ${error.message}`);
      setQuestions([]);
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
    setIsAddingNewSubject(false);
  };

  const handleCreateQuestion = async () => {
    // Validation
    if (!formData.subject?.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    if (!formData.question?.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (formData.options.some(opt => !opt.trim())) {
      toast.error('Please fill in all answer options');
      return;
    }

    try {
      console.log('Saving question with data:', formData);
      
      const questionData = {
        subject: formData.subject.trim(),
        question: formData.question.trim(),
        options: formData.options.map(opt => opt.trim()),
        answer: formData.answer,
        difficulty: formData.difficulty,
        explanation: formData.explanation?.trim() || null
      };

      let result;
      if (editingQuestion) {
        console.log('Updating question:', editingQuestion.id);
        result = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id)
          .select();
      } else {
        console.log('Creating new question');
        result = await supabase
          .from('questions')
          .insert([questionData])
          .select();
      }

      if (result.error) {
        console.error('Error saving question:', result.error);
        throw result.error;
      }

      console.log('Question saved successfully:', result.data);
      toast.success(editingQuestion ? 'Question updated successfully' : 'Question created successfully');
      setIsDialogOpen(false);
      resetForm();
      
      // Refresh both questions and subjects
      await Promise.all([fetchQuestions(), fetchSubjects()]);
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error(`Failed to save question: ${error.message}`);
    }
  };

  const handleEditQuestion = (question: Question) => {
    console.log('Editing question:', question);
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
      console.log('Deleting question:', questionId);
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        console.error('Error deleting question:', error);
        throw error;
      }

      toast.success('Question deleted successfully');
      await Promise.all([fetchQuestions(), fetchSubjects()]);
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error(`Failed to delete question: ${error.message}`);
    }
  };

  const handleSubjectChange = (value: string) => {
    if (value === 'add_new') {
      setIsAddingNewSubject(true);
      setFormData(prev => ({ ...prev, subject: '' }));
    } else {
      setIsAddingNewSubject(false);
      setFormData(prev => ({ ...prev, subject: value }));
    }
  };

  const handleEditSubjectName = (oldName: string) => {
    setEditingSubjectName(oldName);
  };

  const handleSaveSubjectName = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName.trim() === oldName) {
      setEditingSubjectName("");
      return;
    }

    try {
      console.log(`Updating subject name from "${oldName}" to "${newName}"`);
      
      const { error } = await supabase
        .from('questions')
        .update({ subject: newName.trim() })
        .eq('subject', oldName);

      if (error) {
        console.error('Error updating subject name:', error);
        throw error;
      }

      toast.success(`Subject name updated from "${oldName}" to "${newName}"`);
      setEditingSubjectName("");
      await Promise.all([fetchQuestions(), fetchSubjects()]);
    } catch (error) {
      console.error('Error updating subject name:', error);
      toast.error(`Failed to update subject name: ${error.message}`);
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
          <p className="text-muted-foreground">Create and manage quiz questions with custom subjects</p>
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
                  {isAddingNewSubject ? (
                    <div className="space-y-2">
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({...prev, subject: e.target.value}))}
                        placeholder="Enter new subject name"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAddingNewSubject(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Select value={formData.subject} onValueChange={handleSubjectChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select or add subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectsLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          <>
                            {subjects.map(subject => (
                              <SelectItem key={subject.name} value={subject.name}>
                                {subject.name} ({subject.question_count} questions)
                              </SelectItem>
                            ))}
                            <SelectItem value="add_new">
                              <div className="flex items-center">
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Subject
                              </div>
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
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

      {/* Subjects Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subjects Overview
          </CardTitle>
          <CardDescription>
            Manage subjects and their question counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjectsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <div key={subject.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    {editingSubjectName === subject.name ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          defaultValue={subject.name}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveSubjectName(subject.name, e.currentTarget.value);
                            } else if (e.key === 'Escape') {
                              setEditingSubjectName("");
                            }
                          }}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input');
                            if (input) {
                              handleSaveSubjectName(subject.name, input.value);
                            }
                          }}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSubjectName("")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="font-medium">{subject.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {subject.question_count} question{subject.question_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditSubjectName(subject.name)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.name} value={subject.name}>{subject.name}</SelectItem>
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
                {filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {questions.length === 0 ? 'No questions found. Create your first question!' : 'No questions match your search.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuestions.map((question) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQuestions;
