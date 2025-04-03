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
  Download,
  Settings
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<TestAttempt | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [updatedVisibility, setUpdatedVisibility] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);
  
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
        const gs = pdf.GState({ opacity: 0.3 });
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
        setUpdatedVisibility(testData.results_visibility);
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

  const saveTestSettings = async () => {
    if (!testId || !testDetails) return;
    
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('user_tests')
        .update({
          results_visibility: updatedVisibility
        })
        .eq('id', testId);
      
      if (error) throw error;
      
      setTestDetails({
        ...testDetails,
        results_visibility: updatedVisibility
      });
      
      toast({
        title: 'Settings Updated',
        description: 'Test settings have been successfully updated',
      });
      
      setIsSettingsDialogOpen(false);
    } catch (error) {
      console.error('Error updating test settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update test settings',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
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
          answer: typeof currentEditQuestion.answer === 'string' 
            ? parseInt(currentEditQuestion.answer, 10) 
            : currentEditQuestion.answer,
          explanation: currentEditQuestion.explanation
        })
        .eq('id', currentEditQuestion.id);
        
      if (error) throw error;
      
      setTestQuestions(prev => 
        prev.map(q => q.id === currentEditQuestion.id ? {
          ...currentEditQuestion,
          answer: typeof currentEditQuestion.answer === 'string' 
            ? parseInt(currentEditQuestion.answer, 10) 
            : currentEditQuestion.answer
        } : q)
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

  const getVisibilityLabel = (value: string) => {
    switch (value) {
      case 'creator_only':
        return 'Only you (the creator)';
      case 'test_takers':
        return 'Test takers and you';
      case 'public':
        return 'Public (everyone)';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="container max-w-4xl mx-auto pb-10 md:pb-6 md:pl-0 pt-6 px-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2" 
          onClick={() => navigate('/cbt')}
        >
          <ArrowLeft size={16} />
          <span>Back to Tests</span>
        </Button>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={testActive ? "destructive" : "default"}
            onClick={toggleTestStatus}
            className="flex items-center gap-2"
          >
            <StopCircle size={16} />
            {testActive ? 'Deactivate Test' : 'Activate Test'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsSettingsDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            Settings
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{testDetails.title}</CardTitle>
              <CardDescription>
                {testDetails.description || 'No description'}
              </CardDescription>
            </div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash size={16} className="mr-1" />
                  Delete
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-secondary/30 p-3 rounded-md">
              <p className="text-sm font-medium">Results Visibility</p>
              <p className="text-lg">{getVisibilityLabel(testDetails.results_visibility)}</p>
            </div>
            <div className="bg-secondary/30 p-3 rounded-md">
              <p className="text-sm font-medium">Share Code</p>
              <p className="text-lg font-mono">{testDetails.share_code}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center border-t pt-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Status: <span className={testActive ? "text-green-600" : "text-red-600"}>
                {testActive ? "Active" : "Inactive"}
              </span>
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
            <div className="overflow-hidden rounded-md border">
              <div className="overflow-x-auto">
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
                        <TableCell>
                          <div className="flex flex-col md:flex-row gap-2 justify-end">
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
              </div>
            </div>
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
                <Button onClick={() => navigate('/cbt/create')}>Create Questions</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {testQuestions.map((question, index) => (
                <Card key={question.id} className="overflow-hidden">
                  <CardHeader className="bg-secondary/20 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Question {index + 1}</div>
                        <CardTitle className="text-base">{question.question}</CardTitle>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditQuestion(question)}
                      >
                        <PencilIcon size={14} className="mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="grid gap-2">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          className={`p-2 rounded-md border ${
                            question.answer === optIndex 
                              ? 'bg-primary/10 border-primary/30' 
                              : 'bg-secondary/10 border-secondary/30'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-secondary/30 flex items-center justify-center mr-2">
                              <span className="text-xs">{String.fromCharCode(65 + optIndex)}</span>
                            </div>
                            <div>{option}</div>
                            {question.answer === optIndex && (
                              <Check className="h-4 w-4 ml-2 text-primary" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {question.explanation && (
                      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                        <div className="flex items-center text-sm font-medium mb-1 text-yellow-800 dark:text-yellow-200">
                          <HelpCircle className="h-3.5 w-3.5 mr-1" />
                          Explanation
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Test Settings</DialogTitle>
            <DialogDescription>
              Configure settings for your test
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label className="text-base">Results Visibility</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Control who can see the results of this test
            </p>
            
            <RadioGroup 
              value={updatedVisibility} 
              onValueChange={setUpdatedVisibility}
              className="space-y-3"
            >
              <div className="flex items-start space-x-2 border p-3 rounded-md">
                <RadioGroupItem value="creator_only" id="creator_only" />
                <Label htmlFor="creator_only" className="font-normal cursor-pointer flex-1">
                  <span className="font-medium">Creator Only</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Only you will be able to see test results
                  </p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-2 border p-3 rounded-md">
                <RadioGroupItem value="test_takers" id="test_takers" />
                <Label htmlFor="test_takers" className="font-normal cursor-pointer flex-1">
                  <span className="font-medium">Test Takers</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Test takers will see their own results after completing the test
                  </p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-2 border p-3 rounded-md">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal cursor-pointer flex-1">
                  <span className="font-medium">Public</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Results will be visible to anyone who takes the test
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={saveTestSettings}
              disabled={savingSettings}
              className="ml-2"
            >
              {savingSettings ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {savingSettings ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Question Dialog */}
      <Dialog open={isEditQuestionDialogOpen} onOpenChange={setIsEditQuestionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          
          {currentEditQuestion && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="question">Question</Label>
                <Textarea 
                  id="question"
                  value={currentEditQuestion.question}
                  onChange={(e) => handleUpdateQuestionField('question', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Answer Options</Label>
                <div className="space-y-2 mt-2">
                  {currentEditQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary/30 flex items-center justify-center">
                        <span className="text-xs">{String.fromCharCode(65 + index)}</span>
                      </div>
                      <Input 
                        value={option}
                        onChange={(e) => handleUpdateOption(index, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="answer" className="mb-2 inline-block">Correct Answer</Label>
                <RadioGroup 
                  value={String(currentEditQuestion.answer)}
                  onValueChange={(value) => handleUpdateQuestionField('answer', parseInt(value, 10))}
                  className="space-y-2"
                >
                  {currentEditQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(index)} id={`answer-${index}`} />
                      <Label htmlFor={`answer-${index}`} className="cursor-pointer">
                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)}</span>
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea 
                  id="explanation"
                  value={currentEditQuestion.explanation || ''}
                  onChange={(e) => handleUpdateQuestionField('explanation', e.target.value)}
                  className="mt-1"
                  placeholder="Explain why this is the correct answer..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditQuestionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveQuestionChanges}
              disabled={saveLoading}
              className="ml-2"
            >
              {saveLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saveLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div style={{display: 'none'}}>
        {selectedParticipant && (
          <div ref={certificateRef}>
            <Certificate
              name={selectedParticipant.participant_name || "Participant"}
              course={testDetails?.title || "Test"}
              date={new Date(selectedParticipant.completed_at).toLocaleDateString()}
              score={`${selectedParticipant.score}/${selectedParticipant.total_questions}`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTest;
