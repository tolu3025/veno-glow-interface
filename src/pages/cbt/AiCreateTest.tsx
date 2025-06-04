
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Zap, RefreshCw, Settings, Sparkles, BookOpen } from "lucide-react";
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
import FeatureAccessGuard from "@/components/billing/FeatureAccessGuard";
import { BillingService } from "@/services/billingService";

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
  { value: "mathematics", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "english", label: "English Language" },
  { value: "computer_science", label: "Computer Science" },
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
  { value: "economics", label: "Economics" },
  { value: "government", label: "Government" }
];

const difficultyOptions = [
  { value: "beginner", label: "Beginner", description: "Basic concepts and fundamental knowledge" },
  { value: "intermediate", label: "Intermediate", description: "Moderate complexity with some analysis" },
  { value: "advanced", label: "Advanced", description: "Complex problems requiring deep understanding" },
];

const resultsVisibilityOptions = [
  { value: "creator_only", label: "Only me (creator)" },
  { value: "test_takers", label: "Test takers (see only their results)" },
  { value: "public", label: "Public (test takers can see all results)" },
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

    // Consume feature access
    const accessConsumed = await BillingService.consumeFeatureAccess('ai_test');
    if (!accessConsumed) {
      toast({
        title: "Access limit reached",
        description: "You have reached your AI test creation limit. Please purchase more access.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-questions', {
        body: {
          subject: watchedValues.subject,
          difficulty: watchedValues.difficulty,
          questionCount: watchedValues.questionCount,
          topic: watchedValues.topic,
          questionTypes: watchedValues.questionTypes
        }
      });

      if (error) {
        console.error('Error generating questions:', error);
        throw error;
      }

      setGeneratedQuestions(data.questions || []);
      setPreviewMode(true);
      
      toast({
        title: "Questions generated successfully!",
        description: `Generated ${data.questions?.length || 0} questions. Review them below.`,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error generating questions",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
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
    <FeatureAccessGuard featureType="ai_test">
      <div className="pb-14">
        <div className="flex items-center space-x-4 mb-6">
          <button 
            onClick={() => navigate('/cbt')}
            className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Test Creation
            </h1>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="veno-card p-5 space-y-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-medium">Test Configuration</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter test title" {...field} />
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
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjectOptions.map((option) => (
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
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter test description or specific instructions for AI" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Topic (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Quadratic Equations, Photosynthesis, etc."
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Specify a particular topic to focus the AI generation
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {difficultyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
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
                name="questionCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={5}
                        max={50}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      Choose between 5-50 questions for your test
                    </FormDescription>
                  </FormItem>
                )}
              />

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
                        className="h-4 w-4 text-purple-600"
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-medium">AI Question Generation</h2>
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

              {!previewMode ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                    <h3 className="text-lg font-medium mb-2">Ready to Generate Questions?</h3>
                    <p className="text-muted-foreground">
                      Our AI will create high-quality questions based on your specifications
                    </p>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={generateQuestions}
                    disabled={generating || !watchedValues.subject || !watchedValues.difficulty}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate Questions
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {generatedQuestions.length} questions generated successfully!
                      </span>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {generatedQuestions.map((question, index) => (
                      <Card key={index} className="p-4">
                        <h4 className="font-medium mb-2">
                          {index + 1}. {question.question}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          {question.options?.map((option: string, optIndex: number) => (
                            <div
                              key={optIndex}
                              className={`text-sm p-2 rounded ${
                                optIndex === question.correctAnswer
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
                                  : 'bg-gray-50 dark:bg-gray-800'
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {optIndex === question.correctAnswer && ' ✓'}
                            </div>
                          ))}
                        </div>
                        {question.explanation && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                            <strong>Explanation:</strong> {question.explanation}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
            
            {generatedQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex justify-end"
              >
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={saving}
                  size="lg"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving Test...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1 h-4 w-4" /> 
                      Save AI Test
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </form>
        </Form>
      </div>
    </FeatureAccessGuard>
  );
};

export default AiCreateTest;
