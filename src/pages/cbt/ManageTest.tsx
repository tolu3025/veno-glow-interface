
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  XCircle,
  BookOpen,
  HelpCircle,
  Trash,
  Download
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
  options: string[]; // This was causing the error - now explicitly string[]
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<TestAttempt | null>(null);
  
  const certificateRef = useRef<HTMLDivElement>(null);
  const participantResultRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
    documentTitle: `Certificate - ${testDetails?.title || 'Test'} Result`,
    removeAfterPrint: true,
    pageStyle: `
      @page { 
        size: letter landscape; 
        margin: 0.5cm; 
      }
      @media print {
        body, html { 
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background-color: white;
        }
        * {
          color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .certificate-container {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          page-break-inside: avoid;
        }
      }
    `,
    onBeforeGetContent: () => {
      const style = document.createElement('style');
      style.innerHTML = `
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        body { background-color: white; }
      `;
      document.head.appendChild(style);
      return Promise.resolve();
    }
  });

  const downloadParticipantPDF = async (attempt: TestAttempt) => {
    if (!attempt) return;
    
    setSelectedParticipant(attempt);
    setSelectedAttemptId(attempt.id);
    
    toast({
      title: "Preparing PDF",
      description: "Creating participant results PDF...",
    });
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      pdf.setFillColor(65, 84, 241);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text("Test Results Summary", 105, 12, { align: 'center' });
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.text(`${testDetails?.title || 'Test'} Results`, 105, 30, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Participant: ${attempt.participant_name || 'Anonymous'}`, 20, 45);
      pdf.text(`Email: ${attempt.participant_email || 'Not provided'}`, 20, 53);
      pdf.text(`Date Taken: ${formatDate(attempt.completed_at)}`, 20, 61);
      
      pdf.setFontSize(14);
      pdf.text(`Score: ${attempt.score}/${attempt.total_questions}`, 20, 75);
      pdf.text(`Percentage: ${Math.round((attempt.score / attempt.total_questions) * 100)}%`, 20, 85);
      
      const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
      let status = "Satisfactory";
      
      if (percentage >= 80) {
        status = "Excellent";
        pdf.setTextColor(0, 128, 0);
      } else if (percentage >= 60) {
        status = "Good";
        pdf.setTextColor(0, 0, 200);
      } else if (percentage < 50) {
        status = "Needs Improvement";
        pdf.setTextColor(200, 0, 0);
      }
      
      pdf.text(`Status: ${status}`, 20, 95);
      pdf.setTextColor(0, 0, 0);
      
      const position = getParticipantPosition(attempt.id);
      if (position) {
        pdf.text(`Rank: ${position} position among all participants`, 20, 105);
      }
      
      pdf.setDrawColor(100, 100, 100);
      pdf.line(20, 115, 190, 115);
      pdf.text("Notes:", 20, 125);
      
      for (let i = 0; i < 3; i++) {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, 135 + (i * 10), 190, 135 + (i * 10));
      }
      
      pdf.line(20, 240, 80, 240);
      pdf.text("Examiner's Signature", 20, 250);
      
      pdf.line(120, 240, 180, 240);
      pdf.text("Date", 145, 250);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Veno Education Platform", 105, 270, { align: 'center' });
      pdf.text(`Document generated on ${new Date().toLocaleDateString()}`, 105, 275, { align: 'center' });
      
      if (attempt.disqualified) {
        // Fix: Create a GState object correctly
        const gs = pdf.GState(new pdf.GState({ opacity: 0.3 }));
        pdf.setGState(gs);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(220, 0, 0);
        pdf.setFontSize(40);
        pdf.text("DISQUALIFIED", 105, 160, { align: 'center', angle: 45 });
      }
      
      pdf.save(`${attempt.participant_name || 'Participant'}_${testDetails?.title || 'Test'}_Results.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Participant results have been saved as a PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

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
        const storedActiveState = localStorage.getItem(`test_active_${testId}`);
        setTestActive(storedActiveState === null ? true : storedActiveState === 'true');

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
        const questions = data.map(q => ({
          id: q.id,
          question: q.question,
          options: Array.isArray(q.options) ? q.options.map(String) : [],
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
      const newActiveState = !testActive;
      setTestActive(newActiveState);
      
      localStorage.setItem(`test_active_${testId}`, String(newActiveState));
      
      toast({
        title: newActiveState ? 'Test Activated' : 'Test Deactivated',
        description: newActiveState 
          ? 'The test is now accepting submissions' 
          : 'The test will no longer accept new submissions',
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

  const deleteTest = async () => {
    if (!testId || !testDetails) return;
    
    setDeleteLoading(true);
    try {
      await supabase
        .from('test_questions')
        .delete()
        .eq('test_id', testId);
      
      const { error } = await supabase
        .from('user_tests')
        .delete()
        .eq('id', testId);
      
      if (error) throw error;
      
      toast({
        title: 'Test Deleted',
        description: 'The test has been successfully deleted',
      });
      
      navigate('/cbt');
    } catch (error) {
      console.error('Error deleting test:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete test',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
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
    
    const position = index + 1;
    if (position === 1) return "1st";
    if (position === 2) return "2nd";
    if (position === 3) return "3rd";
    return `${position}th`;
  };

  const printParticipantResult = (attempt: TestAttempt) => {
    setSelectedParticipant(attempt);
    setSelectedAttemptId(attempt.id);
    
    setTimeout(() => {
      handlePrint();
    }, 100);
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
          
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash size={16} />
                Delete Test
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Test</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the test and all associated data. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={deleteTest}
                  disabled={deleteLoading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash className="h-4 w-4 mr-2" />
                  )}
                  {deleteLoading ? 'Deleting...' : 'Delete Test'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printParticipantResult(attempt)}
                              className="text-sky-600"
                            >
                              <Printer className="h-3.5 w-3.5 mr-1" />
                              Print
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadParticipantPDF(attempt)}
                              className="text-blue-600"
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              PDF
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
                          </div>
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
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-veno-primary" />
              <h2 className="text-xl font-bold">Questions ({testQuestions.length})</h2>
            </div>
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
                <motion.div 
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
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
                      {question.explanation ? (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <BookOpen size={20} className="mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Explanation:</p>
                              <p className="text-blue-700 dark:text-blue-300/90">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-md border border-gray-200 dark:border-gray-700 text-muted-foreground text-sm italic">
                          No explanation provided for this question
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
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
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={16} className="text-veno-primary" />
                  <Label htmlFor="explanation">Explanation (Optional)</Label>
                </div>
                <Textarea 
                  id="explanation" 
                  value={currentEditQuestion.explanation || ''}
                  onChange={(e) => handleUpdateQuestionField('explanation', e.target.value)}
                  rows={4}
                  className="mt-1"
                  placeholder="Explain why the answer is correct. This will help test takers learn from their mistakes."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  <HelpCircle className="inline h-3 w-3 mr-1" />
                  A clear explanation improves the educational value of your test
                </p>
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
        <div ref={certificateRef} className="certificate-container p-8 bg-white">
          {selectedParticipant && (
            <div className="max-w-4xl mx-auto border-8 border-double border-blue-600 p-8 text-center">
              <h1 className="text-3xl font-bold text-blue-800 mb-2">Certificate of Completion</h1>
              <div className="text-lg mb-6">This certifies that</div>
              <h2 className="text-2xl font-bold mb-6">{selectedParticipant.participant_name || 'Anonymous'}</h2>
              <div className="text-lg mb-2">has successfully completed</div>
              <h3 className="text-xl font-bold mb-6">{testDetails?.title || 'Assessment'}</h3>
              <div className="mb-6">
                <span className="text-lg font-semibold">
                  Score: {selectedParticipant.score}/{selectedParticipant.total_questions} 
                  ({Math.round((selectedParticipant.score / selectedParticipant.total_questions) * 100)}%)
                </span>
              </div>
              <div className="text-sm mb-8">
                Date: {formatDate(selectedParticipant.completed_at)}
              </div>
              <div className="flex justify-between items-end mt-12 pt-8">
                <div className="text-center border-t border-gray-300 inline-block px-8">
                  <p className="text-sm pt-1">Examiner's Signature</p>
                </div>
                <div className="flex items-center">
                  <VenoLogo className="h-12 w-12 mr-2" />
                  <span className="text-xl font-bold">Veno Education</span>
                </div>
              </div>
              {selectedParticipant.disqualified && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl font-bold text-red-500 opacity-40 transform rotate-45 border-8 border-red-500 px-4 py-2">
                    DISQUALIFIED
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTest;
