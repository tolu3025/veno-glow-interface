
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { 
  ArrowLeft, 
  StopCircle, 
  Printer, 
  Check, 
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  PencilIcon,
  Save,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { VenoLogo } from '@/components/ui/logo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Certificate from '@/components/certificate/Certificate';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type Test = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  time_limit: number | null;
  question_count: number;
  created_at: string;
  share_code: string;
  results_visibility: string;
  allow_retakes: boolean;
  creator_id: string;
};

type TestAttempt = {
  id: string;
  participant_name: string;
  participant_email: string;
  score: number;
  total_questions: number;
  completed_at: string;
  disqualified?: boolean;
};

type TestQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
};

const ManageTest = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [testDetails, setTestDetails] = useState<Test | null>(null);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [testActive, setTestActive] = useState(true);
  const [disqualifying, setDisqualifying] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [isEditQuestionDialogOpen, setIsEditQuestionDialogOpen] = useState(false);
  const [currentEditQuestion, setCurrentEditQuestion] = useState<TestQuestion | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${testDetails?.title || 'Test'} - Certificate`,
    removeAfterPrint: true,
    pageStyle: `
      @page { size: letter; margin: 0.5cm; }
      @media print {
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print { display: none !important; }
        .print-content { display: block !important; }
      }
    `,
  });

  useEffect(() => {
    const fetchTestData = async () => {
      if (!user || !testId) {
        navigate('/cbt');
        return;
      }

      setLoading(true);
      try {
        const { data: testData, error: testError } = await supabase
          .from('user_tests')
          .select('*')
          .eq('id', testId)
          .single();

        if (testError || !testData) {
          throw new Error('Test not found');
        }

        if (testData.creator_id !== user.id) {
          navigate('/cbt');
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to manage this test',
            variant: 'destructive',
          });
          return;
        }

        setTestDetails(testData);

        const { data: attemptsData, error: attemptsError } = await supabase
          .from('test_attempts')
          .select('*')
          .eq('test_id', testId)
          .order('completed_at', { ascending: false });

        if (attemptsError) {
          throw attemptsError;
        }

        setTestAttempts(attemptsData || []);
        fetchTestQuestions();
      } catch (error) {
        console.error('Error fetching test data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load test data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId, user, navigate, toast]);

  const fetchTestQuestions = async () => {
    if (!testId) return;
    
    setLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', testId);
        
      if (error) throw error;
      
      if (data) {
        // Transform data to match our TestQuestion type
        const questions = data.map(q => ({
          id: q.id,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [],
          answer: q.answer,
          explanation: q.explanation || ''
        }));
        
        setTestQuestions(questions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load test questions',
        variant: 'destructive', 
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const toggleTestStatus = async () => {
    if (!testDetails) return;

    try {
      setTestActive(!testActive);
      
      toast({
        title: testActive ? 'Test Deactivated' : 'Test Activated',
        description: testActive 
          ? 'The test will no longer accept new submissions' 
          : 'The test is now accepting submissions',
      });
    } catch (error) {
      console.error('Error toggling test status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update test status',
        variant: 'destructive',
      });
    }
  };

  const disqualifyParticipant = async (attemptId: string) => {
    setDisqualifying(attemptId);
    
    try {
      setTestAttempts(prevAttempts => 
        prevAttempts.map(attempt => 
          attempt.id === attemptId 
            ? {...attempt, disqualified: true} 
            : attempt
        )
      );
      
      toast({
        title: 'Participant Disqualified',
        description: 'The participant has been disqualified from this test',
      });
    } catch (error) {
      console.error('Error disqualifying participant:', error);
      toast({
        title: 'Error',
        description: 'Failed to disqualify participant',
        variant: 'destructive',
      });
    } finally {
      setDisqualifying(null);
    }
  };

  const reinstateParticipant = async (attemptId: string) => {
    try {
      setTestAttempts(prevAttempts => 
        prevAttempts.map(attempt => 
          attempt.id === attemptId 
            ? {...attempt, disqualified: false} 
            : attempt
        )
      );
      
      toast({
        title: 'Participant Reinstated',
        description: 'The participant has been reinstated to this test',
      });
    } catch (error) {
      console.error('Error reinstating participant:', error);
      toast({
        title: 'Error',
        description: 'Failed to reinstate participant',
        variant: 'destructive',
      });
    }
  };

  const refreshData = async () => {
    if (!testId) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('test_id', testId)
        .order('completed_at', { ascending: false });
        
      if (error) throw error;
      setTestAttempts(data || []);
      
      toast({
        title: 'Refreshed',
        description: 'Test results have been updated',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh test data',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getSelectedParticipant = () => {
    return testAttempts.find(attempt => attempt.id === selectedAttemptId);
  };

  const getSortedAttempts = () => {
    return [...testAttempts].sort((a, b) => b.score / b.total_questions - a.score / a.total_questions);
  };

  const getParticipantPosition = (attemptId: string) => {
    const sortedAttempts = getSortedAttempts();
    const index = sortedAttempts.findIndex(attempt => attempt.id === attemptId);
    if (index === -1) return '';
    
    // Convert to position (1st, 2nd, 3rd, etc.)
    const position = index + 1;
    if (position === 1) return "1st";
    if (position === 2) return "2nd";
    if (position === 3) return "3rd";
    return `${position}th`;
  };

  const printParticipantResult = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setTimeout(() => {
      handlePrint();
    }, 300);
  };

  const handleEditQuestion = (question: TestQuestion) => {
    setCurrentEditQuestion({...question});
    setIsEditQuestionDialogOpen(true);
  };

  const handleUpdateQuestionField = (field: string, value: any) => {
    if (!currentEditQuestion) return;
    setCurrentEditQuestion(prev => {
      if (!prev) return prev;
      return {...prev, [field]: value};
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    if (!currentEditQuestion) return;
    const newOptions = [...currentEditQuestion.options];
    newOptions[index] = value;
    setCurrentEditQuestion({...currentEditQuestion, options: newOptions});
  };

  const saveQuestionChanges = async () => {
    if (!currentEditQuestion || !testId) return;
    
    setSaveLoading(true);
    try {
      const { error } = await supabase
        .from('test_questions')
        .update({
          question: currentEditQuestion.question,
          options: currentEditQuestion.options,
          answer: currentEditQuestion.answer,
          explanation: currentEditQuestion.explanation
        })
        .eq('id', currentEditQuestion.id);
        
      if (error) throw error;
      
      setTestQuestions(prev => 
        prev.map(q => q.id === currentEditQuestion.id ? currentEditQuestion : q)
      );
      
      toast({
        title: 'Question Updated',
        description: 'The question has been successfully updated',
      });
      
      setIsEditQuestionDialogOpen(false);
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update the question',
        variant: 'destructive',
      });
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-veno-primary" />
      </div>
    );
  }

  if (!testDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
        <p className="text-muted-foreground mb-6">The test you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate('/cbt')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto pb-10 md:pb-6 md:pl-0 pt-6">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2" 
          onClick={() => navigate('/cbt')}
        >
          <ArrowLeft size={16} />
          <span>Back to Tests</span>
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant={testActive ? "destructive" : "default"}
            onClick={toggleTestStatus}
            className="flex items-center gap-2"
          >
            <StopCircle size={16} />
            {testActive ? 'Deactivate Test' : 'Activate Test'}
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{testDetails.title}</CardTitle>
          <CardDescription>
            {testDetails.description || 'No description'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-secondary/30 p-3 rounded-md">
              <p className="text-sm font-medium">Questions</p>
              <p className="text-lg">{testDetails.question_count}</p>
            </div>
            <div className="bg-secondary/30 p-3 rounded-md">
              <p className="text-sm font-medium">Time Limit</p>
              <p className="text-lg">{testDetails.time_limit || 'No'} min</p>
            </div>
            <div className="bg-secondary/30 p-3 rounded-md">
              <p className="text-sm font-medium">Difficulty</p>
              <p className="text-lg capitalize">{testDetails.difficulty}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Share Code: <span className="font-mono bg-secondary/50 px-1 rounded">{testDetails.share_code}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Created: {formatDate(testDetails.created_at)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="participants">
        <TabsList className="mb-4">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="participants">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Participants ({testAttempts.length})</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-1"
            >
              {refreshing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Refresh
            </Button>
          </div>
          
          {testAttempts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground mb-4">
                  No one has taken this test yet
                </p>
                <Button onClick={() => navigate('/cbt')}>Back to Dashboard</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testAttempts.map((attempt) => (
                      <TableRow 
                        key={attempt.id} 
                        className={attempt.disqualified ? "bg-destructive/10" : ""}
                      >
                        <TableCell className="font-medium">
                          {attempt.participant_name || 'Anonymous'}
                        </TableCell>
                        <TableCell>{attempt.participant_email || 'N/A'}</TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium">
                            {attempt.score}/{attempt.total_questions}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((attempt.score / attempt.total_questions) * 100)}%
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => printParticipantResult(attempt.id)}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Print
                          </Button>
                          
                          {attempt.disqualified ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  Reinstate
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reinstate Participant</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will reinstate the participant's results. Are you sure?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => reinstateParticipant(attempt.id)}
                                  >
                                    Reinstate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  {disqualifying === attempt.id ? 
                                    <Loader2 className="h-4 w-4 animate-spin" /> : 
                                    'Disqualify'
                                  }
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Disqualify Participant</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will mark the participant's results as disqualified. Are you sure?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => disqualifyParticipant(attempt.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Disqualify
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="questions">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Questions ({testQuestions.length})</h2>
          </div>
          
          {loadingQuestions ? (
            <Card>
              <CardContent className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-veno-primary" />
              </CardContent>
            </Card>
          ) : testQuestions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground mb-4">
                  No questions found for this test
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {testQuestions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <span>Question {index + 1}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditQuestion(question)}
                        className="h-8 px-2"
                      >
                        <PencilIcon size={16} />
                        <span className="ml-1">Edit</span>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{question.question}</p>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div 
                          key={optionIndex} 
                          className={`p-3 rounded-md border ${
                            optionIndex === question.answer ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${
                              optionIndex === question.answer ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                            }`}>
                              {String.fromCharCode(65 + optionIndex)}
                            </div>
                            <span>{option}</span>
                            {optionIndex === question.answer && (
                              <Check size={16} className="ml-2 text-green-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {question.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium mb-1">Explanation:</p>
                        <p className="text-sm">{question.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Edit Question Dialog */}
      <Dialog open={isEditQuestionDialogOpen} onOpenChange={setIsEditQuestionDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Make changes to the question, options, answer, or explanation.
            </DialogDescription>
          </DialogHeader>
          
          {currentEditQuestion && (
            <div className="space-y-4 my-2">
              <div>
                <Label htmlFor="question">Question</Label>
                <Textarea 
                  id="question" 
                  value={currentEditQuestion.question}
                  onChange={(e) => handleUpdateQuestionField('question', e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Options</Label>
                {currentEditQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className={`min-w-8 h-8 flex items-center justify-center rounded-full ${
                      index === currentEditQuestion.answer ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <Input 
                      value={option}
                      onChange={(e) => handleUpdateOption(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={index === currentEditQuestion.answer ? 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200' : ''}
                      onClick={() => handleUpdateQuestionField('answer', index)}
                    >
                      {index === currentEditQuestion.answer ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        'Set as Answer'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
              
              <div>
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea 
                  id="explanation" 
                  value={currentEditQuestion.explanation || ''}
                  onChange={(e) => handleUpdateQuestionField('explanation', e.target.value)}
                  rows={2}
                  className="mt-1"
                  placeholder="Explain why the answer is correct..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditQuestionDialogOpen(false)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={saveQuestionChanges}
              disabled={saveLoading}
            >
              {saveLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="hidden">
        <div ref={printRef} className="p-8 print-content">
          {selectedAttemptId && getSelectedParticipant() && (
            <Certificate 
              userName={getSelectedParticipant()?.participant_name || 'Anonymous'} 
              achievementName={`${testDetails?.title || 'Test'} Assessment`}
              date={formatDate(getSelectedParticipant()!.completed_at)}
              score={Math.round((getSelectedParticipant()!.score / getSelectedParticipant()!.total_questions) * 100)}
              position={getParticipantPosition(selectedAttemptId)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTest;
