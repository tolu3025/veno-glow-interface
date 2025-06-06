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
import { Plus, Edit, Trash2, Search, Loader, BookOpen, Filter, Save, X, Zap, RefreshCw, Brain, Sparkles } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

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

const subjectOptions = [
  { value: "mathematics", label: "Mathematics", icon: "📊" },
  { value: "physics", label: "Physics", icon: "⚛️" },
  { value: "chemistry", label: "Chemistry", icon: "🧪" },
  { value: "biology", label: "Biology", icon: "🧬" },
  { value: "english", label: "English Language", icon: "📚" },
  { value: "computer_science", label: "Computer Science", icon: "💻" },
  { value: "history", label: "History", icon: "🏛️" },
  { value: "geography", label: "Geography", icon: "🌍" },
  { value: "economics", label: "Economics", icon: "💰" },
  { value: "government", label: "Government", icon: "🏛️" }
];

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
  const [newSubjectName, setNewSubjectName] = useState<string>("");
  
  // AI Generation state
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiSubject, setAiSubject] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("intermediate");
  const [aiTopic, setAiTopic] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  
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

  const generateAiQuestions = async () => {
    if (!aiSubject || !aiDifficulty) {
      toast.error('Please select a subject and difficulty level');
      return;
    }

    setAiGenerating(true);
    
    try {
      console.log('Generating AI questions with data:', {
        subject: aiSubject,
        difficulty: aiDifficulty,
        questionCount: aiQuestionCount,
        topic: aiTopic
      });

      const { data, error } = await supabase.functions.invoke('generate-ai-questions', {
        body: {
          subject: aiSubject,
          difficulty: aiDifficulty,
          questionCount: aiQuestionCount,
          topic: aiTopic,
          questionTypes: ["multiple_choice"]
        }
      });

      console.log('AI generation response:', { data, error });

      if (error) {
        console.error('Error from edge function:', error);
        throw new Error(error.message || 'Failed to generate questions');
      }

      if (!data || !data.success) {
        console.error('Function returned unsuccessful response:', data);
        throw new Error(data?.error || 'Failed to generate questions');
      }

      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        console.error('No questions in response:', data);
        throw new Error('No questions were generated. Please try again.');
      }

      setGeneratedQuestions(data.questions);
      toast.success(`Generated ${data.questions.length} questions successfully!`);
    } catch (error: any) {
      console.error('Error generating questions:', error);
      
      if (error.message?.includes('API key not configured')) {
        toast.error('Please configure your OpenAI API key to use AI question generation.');
      } else {
        toast.error(error.message || 'Failed to generate questions. Please try again.');
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const saveAiQuestions = async () => {
    if (generatedQuestions.length === 0) {
      toast.error('No questions to save');
      return;
    }

    try {
      const questionsToInsert = generatedQuestions.map(q => ({
        subject: aiSubject,
        question: q.question,
        options: q.options,
        answer: q.correctAnswer,
        difficulty: aiDifficulty,
        explanation: q.explanation || null
      }));

      console.log('Saving AI generated questions:', questionsToInsert);

      const { error } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (error) {
        console.error('Error saving AI questions:', error);
        throw error;
      }

      toast.success(`Successfully saved ${questionsToInsert.length} AI-generated questions!`);
      setIsAiDialogOpen(false);
      setGeneratedQuestions([]);
      
      // Refresh data
      await Promise.all([fetchQuestions(), fetchSubjects()]);
    } catch (error) {
      console.error('Error saving AI questions:', error);
      toast.error(`Failed to save questions: ${error.message}`);
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
    setNewSubjectName('');
  };

  const handleCreateQuestion = async () => {
    // Get the final subject name - either from existing selection or new subject input
    const finalSubjectName = isAddingNewSubject ? newSubjectName.trim() : formData.subject.trim();
    
    console.log('Validation check:', {
      finalSubjectName,
      isAddingNewSubject,
      newSubjectName,
      formDataSubject: formData.subject,
      question: formData.question,
      options: formData.options
    });

    // Validation
    if (!finalSubjectName) {
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
      console.log('Saving question with data:', {
        ...formData,
        subject: finalSubjectName
      });
      
      const questionData = {
        subject: finalSubjectName,
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
        toast.error(`Failed to save question: ${result.error.message}`);
        return;
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
    setIsAddingNewSubject(false);
    setNewSubjectName('');
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
    console.log('Subject change:', value);
    if (value === 'add_new') {
      setIsAddingNewSubject(true);
      setFormData(prev => ({ ...prev, subject: '' }));
      setNewSubjectName('');
    } else {
      setIsAddingNewSubject(false);
      setFormData(prev => ({ ...prev, subject: value }));
      setNewSubjectName('');
    }
  };

  const handleEditSubjectName = (oldName: string) => {
    setEditingSubjectName(oldName);
  };

  const handleSaveSubjectName = async (oldName: string, newName: string) => {
    const trimmedNewName = newName.trim();
    
    if (!trimmedNewName || trimmedNewName === oldName) {
      setEditingSubjectName("");
      return;
    }

    try {
      console.log(`Updating subject name from "${oldName}" to "${trimmedNewName}"`);
      
      const { error } = await supabase
        .from('questions')
        .update({ subject: trimmedNewName })
        .eq('subject', oldName);

      if (error) {
        console.error('Error updating subject name:', error);
        toast.error(`Failed to update subject name: ${error.message}`);
        return;
      }

      toast.success(`Subject name updated from "${oldName}" to "${trimmedNewName}"`);
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
        <div className="flex gap-2">
          <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 border-0">
                <Brain className="mr-2 h-4 w-4" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Question Generation
                </DialogTitle>
                <DialogDescription>
                  Generate high-quality questions using AI technology
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ai-subject">Subject</Label>
                    <Select value={aiSubject} onValueChange={setAiSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span>{option.icon}</span>
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ai-difficulty">Difficulty</Label>
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
                </div>

                <div>
                  <Label htmlFor="ai-topic">Specific Topic (Optional)</Label>
                  <Input
                    id="ai-topic"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g., Quadratic Equations, Photosynthesis, etc."
                  />
                </div>

                <div>
                  <Label>Number of Questions: {aiQuestionCount}</Label>
                  <Slider
                    min={1}
                    max={20}
                    step={1}
                    value={[aiQuestionCount]}
                    onValueChange={(value) => setAiQuestionCount(value[0])}
                    className="w-full py-4"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={generateAiQuestions}
                    disabled={aiGenerating || !aiSubject}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {aiGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate Questions
                      </>
                    )}
                  </Button>
                  
                  {generatedQuestions.length > 0 && (
                    <Button onClick={saveAiQuestions} variant="outline">
                      <Save className="mr-2 h-4 w-4" />
                      Save {generatedQuestions.length} Questions
                    </Button>
                  )}
                </div>

                {generatedQuestions.length > 0 && (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {generatedQuestions.length} questions generated successfully!
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </Badge>
                    </div>
                    
                    {generatedQuestions.map((question, index) => (
                      <Card key={index} className="border border-purple-200">
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2">
                            {index + 1}. {question.question}
                          </h4>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            {question.options?.map((option: string, optIndex: number) => (
                              <div
                                key={optIndex}
                                className={`text-sm p-2 rounded ${
                                  optIndex === question.correctAnswer
                                    ? 'bg-green-100 text-green-700 font-medium border border-green-200'
                                    : 'bg-gray-50'
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}. {option}
                              </div>
                            ))}
                          </div>
                          {question.explanation && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

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
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="Enter new subject name"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setIsAddingNewSubject(false);
                            setNewSubjectName('');
                          }}
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
                          onBlur={(e) => {
                            handleSaveSubjectName(subject.name, e.target.value);
                          }}
                          autoFocus
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
