
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, PlusCircle, HelpCircle, Trash2, BookOpen, Info, Database, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useSubjects } from "@/hooks/useSubjects";

const testFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  difficulty: z.string().min(1, { message: "Please select a difficulty level" }),
  timeLimit: z.string().optional(),
  resultsVisibility: z.enum(["creator_only", "test_takers", "public"], { 
    required_error: "Please select who can view results" 
  }),
  allowRetakes: z.boolean().default(false),
  subject: z.string().min(1, { message: "Please select a subject" }),
});

type TestFormValues = z.infer<typeof testFormSchema>;

const difficultyOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const resultsVisibilityOptions = [
  { value: "creator_only", label: "Only me (creator)" },
  { value: "test_takers", label: "Test takers (see only their results)" },
  { value: "public", label: "Public (test takers can see all results)" },
];

type Question = {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  explanation?: string;
};

// Define a type for bank questions
type BankQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  subject: string;
  explanation?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
};

const CreateTest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { subjects } = useSubjects();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: crypto.randomUUID(),
    text: "",
    options: ["", "", "", ""],
    correctOption: 0,
    explanation: "",
  });
  const [saving, setSaving] = useState(false);
  const [questionMode, setQuestionMode] = useState<'create' | 'bank'>('create');
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [loadingBankQuestions, setLoadingBankQuestions] = useState(false);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<{[key: string]: boolean}>({});
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "intermediate",
      timeLimit: "",
      resultsVisibility: "creator_only",
      allowRetakes: false,
      subject: "",
    },
  });

  // Get the selected subject from the form
  const selectedSubject = form.watch('subject');

  // Load questions from the bank when subject changes
  useEffect(() => {
    if (questionMode === 'bank' && selectedSubject) {
      fetchBankQuestions(selectedSubject);
    }
  }, [questionMode, selectedSubject]);

  const fetchBankQuestions = async (subject: string) => {
    if (!subject) return;
    
    setLoadingBankQuestions(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject', subject);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedQuestions = data.map(q => ({
          id: q.id,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [],
          answer: q.answer,
          subject: q.subject,
          explanation: q.explanation,
          difficulty: q.difficulty
        }));
        
        setBankQuestions(formattedQuestions);
      }
    } catch (error) {
      console.error("Error fetching bank questions:", error);
      toast({
        title: "Error loading questions",
        description: "Failed to load questions from the bank",
        variant: "destructive",
      });
    } finally {
      setLoadingBankQuestions(false);
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) {
      toast({
        title: "Question text is required",
        description: "Please enter the question text",
        variant: "destructive",
      });
      return;
    }
    
    if (currentQuestion.options.some(opt => !opt.trim())) {
      toast({
        title: "All options are required",
        description: "Please fill in all option fields",
        variant: "destructive",
      });
      return;
    }
    
    setQuestions([...questions, currentQuestion]);
    setCurrentQuestion({
      id: crypto.randomUUID(),
      text: "",
      options: ["", "", "", ""],
      correctOption: 0,
      explanation: "",
    });
    
    toast({
      title: "Question added",
      description: "Your question has been added to the test",
    });
  };
  
  const updateOption = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };
  
  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const toggleBankQuestion = (id: string) => {
    setSelectedBankQuestions({
      ...selectedBankQuestions,
      [id]: !selectedBankQuestions[id]
    });
  };

  const addSelectedBankQuestions = () => {
    const selectedIds = Object.entries(selectedBankQuestions)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
      
    if (selectedIds.length === 0) {
      toast({
        title: "No questions selected",
        description: "Please select at least one question to add",
        variant: "destructive",
      });
      return;
    }
    
    const questionsToAdd = bankQuestions
      .filter(q => selectedIds.includes(q.id))
      .map(q => ({
        id: crypto.randomUUID(),
        text: q.question,
        options: q.options,
        correctOption: q.answer,
        explanation: q.explanation || '',
      }));
      
    setQuestions([...questions, ...questionsToAdd]);
    setSelectedBankQuestions({});
    
    toast({
      title: "Questions added",
      description: `${questionsToAdd.length} question(s) have been added to your test`,
    });
  };

  const filteredBankQuestions = bankQuestions.filter(q => {
    const matchesSearch = searchQuery 
      ? q.question.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    const matchesDifficulty = difficultyFilter === 'all' 
      ? true 
      : q.difficulty === difficultyFilter;
      
    return matchesSearch && matchesDifficulty;
  });
  
  const onSubmit = async (data: TestFormValues) => {
    if (questions.length === 0) {
      toast({
        title: "No questions added",
        description: "Please add at least one question to your test",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    
    try {
      if (!user) {
        throw new Error("You must be logged in to create a test");
      }
      
      console.log("Creating test with data:", {
        ...data,
        questionCount: questions.length,
        creatorId: user.id
      });
      
      const { data: testData, error: testError } = await supabase
        .from('user_tests')
        .insert({
          title: data.title,
          description: data.description || null,
          difficulty: data.difficulty as any,
          time_limit: data.timeLimit ? parseInt(data.timeLimit) : null,
          creator_id: user.id,
          subject: data.subject,
          question_count: questions.length,
          results_visibility: data.resultsVisibility,
          allow_retakes: data.allowRetakes,
        })
        .select();
        
      if (testError) {
        console.error("Error inserting test:", testError);
        throw testError;
      }
      
      if (!testData || testData.length === 0) {
        throw new Error("Failed to create test: No test data returned");
      }
      
      const testId = testData[0].id;
      console.log("Test created with ID:", testId);
      
      const questionsToInsert = questions.map(q => ({
        test_id: testId,
        question_text: q.text,
        options: q.options,
        answer: q.correctOption,
        explanation: q.explanation || null,
        subject: data.subject,
      }));
      
      console.log("Inserting questions:", questionsToInsert);
      
      const { error: questionsError } = await supabase
        .from('user_test_questions')
        .insert(questionsToInsert);
      
      if (questionsError) {
        console.error("Error inserting questions:", questionsError);
        throw questionsError;
      }
      
      toast({
        title: "Test created",
        description: "Your test has been created successfully!",
      });
      
      navigate("/cbt");
    } catch (error) {
      console.error("Error creating test:", error);
      toast({
        title: "Error creating test",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-14">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => navigate('/cbt')}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Create Test</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="veno-card p-5 space-y-4"
          >
            <h2 className="text-lg font-medium mb-3">Test Details</h2>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter test title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter test description" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.name} value={subject.name}>
                            {subject.name} ({subject.question_count} questions available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {difficultyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (Optional, in minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter time limit" 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="resultsVisibility"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Results Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-1"
                    >
                      {resultsVisibilityOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`visibility-${option.value}`} />
                          <Label htmlFor={`visibility-${option.value}`}>{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Control who can see the test results after completion
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowRetakes"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 text-veno-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Allow multiple attempts</FormLabel>
                    <FormDescription>
                      If checked, test takers can take the test more than once
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="veno-card p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-veno-primary" />
              <h2 className="text-lg font-medium">Questions</h2>
              <div className="ml-auto">
                <Tabs value={questionMode} onValueChange={(v) => setQuestionMode(v as 'create' | 'bank')}>
                  <TabsList>
                    <TabsTrigger value="create">Create Questions</TabsTrigger>
                    <TabsTrigger value="bank" disabled={!selectedSubject}>
                      Use Question Bank
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            {questionMode === 'create' ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Add questions to your test. Each question must have 4 options with 1 correct answer.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label htmlFor="questionText" className="text-sm font-medium">
                      Question Text
                    </label>
                    <Textarea
                      id="questionText"
                      placeholder="Enter your question"
                      value={currentQuestion.text}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                      className="resize-none mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Options</label>
                    <div className="space-y-2 mt-1">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correctOption"
                            value={index}
                            checked={currentQuestion.correctOption === index}
                            onChange={() => setCurrentQuestion({...currentQuestion, correctOption: index})}
                            className="w-4 h-4 text-veno-primary"
                          />
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <HelpCircle className="inline h-3 w-3 mr-1" />
                      Select the radio button next to the correct answer
                    </p>
                  </div>

                  <div>
                    <label htmlFor="explanationText" className="text-sm font-medium flex items-center gap-1">
                      <Info size={14} className="text-veno-primary" />
                      Explanation (Optional)
                    </label>
                    <Textarea
                      id="explanationText"
                      placeholder="Explain why the correct answer is right (will be shown after the test)"
                      value={currentQuestion.explanation || ""}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                      className="resize-none mt-1"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      <HelpCircle className="inline h-3 w-3 mr-1" />
                      Providing explanations helps test takers learn from their mistakes
                    </p>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addQuestion}
                    className="w-full border-dashed border-veno-primary/40 text-veno-primary"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-veno-primary" />
                    <span className="text-sm font-medium">Question Bank</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {loadingBankQuestions ? "Loading..." : `${bankQuestions.length} questions available`}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search questions..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select
                      value={difficultyFilter}
                      onValueChange={setDifficultyFilter}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Difficulties</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                  {loadingBankQuestions ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading questions from the bank...
                    </div>
                  ) : filteredBankQuestions.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No questions found. Try a different subject or search term.
                    </div>
                  ) : (
                    filteredBankQuestions.map((question) => (
                      <div key={question.id} className="p-3 hover:bg-secondary/40">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={`question-${question.id}`}
                            checked={!!selectedBankQuestions[question.id]}
                            onCheckedChange={() => toggleBankQuestion(question.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`question-${question.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {question.question}
                            </label>
                            <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-muted-foreground">
                              {question.options.map((option, i) => (
                                <div key={i} className={i === question.answer ? "font-medium text-veno-primary" : ""}>
                                  {String.fromCharCode(65 + i)}. {option}
                                  {i === question.answer && " ✓"}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center mt-1 text-xs">
                              <span className={`px-1.5 py-0.5 rounded-full ${
                                question.difficulty === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                question.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {question.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSelectedBankQuestions}
                  disabled={Object.values(selectedBankQuestions).filter(Boolean).length === 0}
                  className="w-full border-dashed border-veno-primary/40 text-veno-primary"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> 
                  Add Selected Questions ({Object.values(selectedBankQuestions).filter(Boolean).length})
                </Button>
              </div>
            )}
            
            {questions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">
                  Added Questions ({questions.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {questions.map((q, i) => (
                    <div key={q.id} className="bg-secondary/40 p-3 rounded-md">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium">
                          {i + 1}. {q.text}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(q.id)}
                          className="h-6 w-6 text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {q.options.map((opt, j) => (
                          <div key={j} className="flex items-center">
                            <span className={j === q.correctOption ? "text-veno-primary font-medium" : ""}>
                              {String.fromCharCode(65 + j)}. {opt}
                              {j === q.correctOption && " ✓"}
                            </span>
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="mt-2 text-xs">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">Explanation:</span> {q.explanation.substring(0, 60)}{q.explanation.length > 60 ? "..." : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end"
          >
            <Button
              type="submit"
              className="bg-veno-primary hover:bg-veno-primary/90"
              disabled={saving}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1 h-4 w-4" /> Save Test
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </Form>
    </div>
  );
};

export default CreateTest;
