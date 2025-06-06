
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Zap, RefreshCw, Settings, Sparkles, BookOpen, Brain, Target, Clock, Users, Star } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Badge } from "@/components/ui/badge";

const aiTestFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  subject: z.string().min(1, { message: "Please select a subject" }),
  difficulty: z.string().min(1, { message: "Please select a difficulty level" }),
  questionCount: z.number().min(5).max(50),
  timeLimit: z.string().optional(),
  resultsVisibility: z.enum(["creator_only", "test_takers", "public"], { 
    required_error: "Please select who can view results" 
  }),
  allowRetakes: z.boolean().default(false),
  topic: z.string().optional(),
  questionTypes: z.array(z.string()).default(["multiple_choice"]),
});

type AiTestFormValues = z.infer<typeof aiTestFormSchema>;

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

const difficultyOptions = [
  { 
    value: "beginner", 
    label: "Beginner", 
    description: "Basic concepts and fundamental knowledge",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "🌱"
  },
  { 
    value: "intermediate", 
    label: "Intermediate", 
    description: "Moderate complexity with some analysis",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: "🎯"
  },
  { 
    value: "advanced", 
    label: "Advanced", 
    description: "Complex problems requiring deep understanding",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "🚀"
  },
];

const resultsVisibilityOptions = [
  { value: "creator_only", label: "Only me (creator)", icon: "👤" },
  { value: "test_takers", label: "Test takers (see only their results)", icon: "👥" },
  { value: "public", label: "Public (test takers can see all results)", icon: "🌐" },
];

const AiCreateTest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  
  const form = useForm<AiTestFormValues>({
    resolver: zodResolver(aiTestFormSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      difficulty: "intermediate",
      questionCount: 10,
      timeLimit: "",
      resultsVisibility: "creator_only",
      allowRetakes: false,
      topic: "",
      questionTypes: ["multiple_choice"],
    },
  });

  const watchedValues = form.watch();

  const generateQuestions = async () => {
    if (!watchedValues.subject || !watchedValues.difficulty) {
      toast({
        title: "Missing information",
        description: "Please select a subject and difficulty level first",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    
    try {
      console.log('Starting AI question generation with data:', {
        subject: watchedValues.subject,
        difficulty: watchedValues.difficulty,
        questionCount: watchedValues.questionCount,
        topic: watchedValues.topic,
        questionTypes: watchedValues.questionTypes
      });

      const { data, error } = await supabase.functions.invoke('generate-ai-questions', {
        body: {
          subject: watchedValues.subject,
          difficulty: watchedValues.difficulty,
          questionCount: watchedValues.questionCount,
          topic: watchedValues.topic,
          questionTypes: watchedValues.questionTypes
        }
      });

      console.log('AI generation response:', { data, error });

      if (error) {
        console.error('Error from edge function:', error);
        throw new Error(error.message || 'Failed to generate questions');
      }

      if (!data) {
        console.error('No data returned from edge function');
        throw new Error('No response from AI service');
      }

      if (!data.success) {
        console.error('Function returned unsuccessful response:', data);
        throw new Error(data.error || 'Failed to generate questions');
      }

      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        console.error('No questions in response:', data);
        throw new Error('No questions were generated. Please try again with different parameters.');
      }

      console.log(`Successfully generated ${data.questions.length} questions`);
      setGeneratedQuestions(data.questions);
      setPreviewMode(true);
      
      toast({
        title: "Questions generated successfully!",
        description: `Generated ${data.questions.length} questions. Review them below.`,
      });
    } catch (error: any) {
      console.error('Error generating questions:', error);
      
      if (error.message?.includes('API key not configured')) {
        toast({
          title: "API Key Required",
          description: "Please configure your OpenAI API key to use AI question generation.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error generating questions",
          description: error.message || "Failed to generate questions. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setGenerating(false);
    }
  };

  const regenerateQuestions = () => {
    setGeneratedQuestions([]);
    setPreviewMode(false);
    generateQuestions();
  };

  const onSubmit = async (data: AiTestFormValues) => {
    if (generatedQuestions.length === 0) {
      toast({
        title: "No questions generated",
        description: "Please generate questions first before saving the test",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    
    try {
      if (!user) {
        throw new Error("You must be logged in to create a test");
      }
      
      console.log("Creating AI test with data:", {
        ...data,
        questionCount: generatedQuestions.length,
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
          question_count: generatedQuestions.length,
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
      console.log("AI Test created with ID:", testId);
      
      const questionsToInsert = generatedQuestions.map(q => ({
        test_id: testId,
        question_text: q.question,
        options: q.options,
        answer: q.correctAnswer,
        explanation: q.explanation || null,
        subject: data.subject,
      }));
      
      console.log("Inserting AI generated questions:", questionsToInsert);
      
      const { error: questionsError } = await supabase
        .from('user_test_questions')
        .insert(questionsToInsert);
      
      if (questionsError) {
        console.error("Error inserting questions:", questionsError);
        throw questionsError;
      }
      
      toast({
        title: "AI Test created successfully!",
        description: "Your AI-generated test has been created with all questions.",
      });
      
      navigate("/cbt");
    } catch (error) {
      console.error("Error creating AI test:", error);
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
    <div className="pb-14 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-950/20 dark:via-background dark:to-pink-950/20 min-h-screen">
      {/* Demo mode banner */}
      <div className="bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 p-3">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-yellow-800 dark:text-yellow-200">
            🚀 Demo Mode Active - Payment guard temporarily disabled for testing
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-4 mb-8"
        >
          <button 
            onClick={() => navigate('/cbt')}
            className="p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Test Creation
              </h1>
              <p className="text-muted-foreground text-sm">Powered by advanced AI technology</p>
            </div>
          </div>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <Sparkles className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-sm">AI-Powered</h3>
              <p className="text-xs text-muted-foreground">Intelligent question generation</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-sm">Customizable</h3>
              <p className="text-xs text-muted-foreground">Tailored to your needs</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-sm">Fast Setup</h3>
              <p className="text-xs text-muted-foreground">Create tests in minutes</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Configuration Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-xl">Test Configuration</CardTitle>
                  </div>
                  <CardDescription>
                    Configure your AI-generated test settings and parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title and Subject */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Test Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter a descriptive test title" 
                              className="h-12"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Subject</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide additional context or specific instructions for the AI to generate better questions" 
                            className="resize-none min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Help the AI understand what kind of test you want to create
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Topic */}
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Specific Topic (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Quadratic Equations, Photosynthesis, World War II, etc."
                            className="h-12"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Narrow down the focus to a specific topic within the subject
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  {/* Difficulty and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Difficulty Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {difficultyOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <span>{option.icon}</span>
                                    <div>
                                      <div className="font-medium">{option.label}</div>
                                      <div className="text-xs text-muted-foreground">{option.description}</div>
                                    </div>
                                  </div>
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
                          <FormLabel className="text-base font-medium">Time Limit (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter time limit in minutes" 
                              className="h-12"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty for unlimited time
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Question Count */}
                  <FormField
                    control={form.control}
                    name="questionCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Number of Questions: {field.value}
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={5}
                            max={50}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full py-4"
                          />
                        </FormControl>
                        <FormDescription>
                          Choose between 5-50 questions for your test (recommended: 10-20)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Settings */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="resultsVisibility"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-base font-medium">Results Visibility</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 md:grid-cols-3 gap-4"
                            >
                              {resultsVisibilityOptions.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                                  <RadioGroupItem value={option.value} id={`visibility-${option.value}`} />
                                  <Label htmlFor={`visibility-${option.value}`} className="flex items-center gap-2 cursor-pointer">
                                    <span>{option.icon}</span>
                                    {option.label}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allowRetakes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 text-purple-600 mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base font-medium">Allow multiple attempts</FormLabel>
                            <FormDescription>
                              If checked, test takers can take the test more than once
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Generation Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <div>
                        <CardTitle className="text-xl">AI Question Generation</CardTitle>
                        <CardDescription>Let AI create high-quality questions for your test</CardDescription>
                      </div>
                    </div>
                    {generatedQuestions.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={regenerateQuestions}
                        disabled={generating}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                        Regenerate
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!previewMode ? (
                    <div className="text-center py-12">
                      <div className="mb-6">
                        <div className="relative inline-block">
                          <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                          <Sparkles className="h-6 w-6 text-pink-500 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Ready to Generate Questions?
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Our advanced AI will create high-quality, contextually relevant questions based on your specifications
                        </p>
                      </div>
                      
                      <Button
                        type="button"
                        onClick={generateQuestions}
                        disabled={generating || !watchedValues.subject || !watchedValues.difficulty}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg h-auto"
                        size="lg"
                      >
                        {generating ? (
                          <>
                            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                            Generating Questions...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-5 w-5" />
                            Generate Questions with AI
                          </>
                        )}
                      </Button>

                      {(!watchedValues.subject || !watchedValues.difficulty) && (
                        <p className="text-sm text-muted-foreground mt-4">
                          Please select a subject and difficulty level to continue
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-green-600" />
                          <div>
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                              {generatedQuestions.length} questions generated successfully!
                            </span>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Review the questions below and save your test when ready
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <Star className="h-3 w-3 mr-1" />
                          AI Generated
                        </Badge>
                      </div>

                      <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                        {generatedQuestions.map((question, index) => (
                          <Card key={index} className="border border-purple-200 dark:border-purple-800">
                            <CardContent className="p-4">
                              <h4 className="font-medium mb-3 text-base">
                                {index + 1}. {question.question}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                {question.options?.map((option: string, optIndex: number) => (
                                  <div
                                    key={optIndex}
                                    className={`text-sm p-3 rounded-lg transition-colors ${
                                      optIndex === question.correctAnswer
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium border border-green-200 dark:border-green-800'
                                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option}
                                    {optIndex === question.correctAnswer && <span className="ml-2 text-green-600">✓</span>}
                                  </div>
                                ))}
                              </div>
                              {question.explanation && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <strong>Explanation:</strong> {question.explanation}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Save Button */}
            {generatedQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center"
              >
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg h-auto"
                  disabled={saving}
                  size="lg"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Saving Test...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" /> 
                      Save AI Test
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AiCreateTest;
