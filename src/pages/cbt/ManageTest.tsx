import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  StopCircle, 
  Printer, 
  Check, 
  X,
  AlertCircle as AlertCircleIcon,
  FileText,
  PencilIcon,
  Save,
  XCircle,
  BookOpen,
  HelpCircle,
  Trash,
  Download 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { VenoLogo } from '@/components/ui/logo';
import { TestHeader } from '@/components/cbt/manage/TestHeader';
import { TestDetails } from '@/components/cbt/manage/TestDetails';
import { ParticipantsList } from '@/components/cbt/manage/ParticipantsList';
import { QuestionsList } from '@/components/cbt/manage/QuestionsList';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Certificate from '@/components/certificate/Certificate';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion } from 'framer-motion';

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
  const [activeTab, setActiveTab] = useState('participants');
  const [hasLoadedQuestions, setHasLoadedQuestions] = useState(false);
  
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

  const fetchTestQuestions = async () => {
    if (!testId || hasLoadedQuestions) return;
    
    setLoadingQuestions(true);
    try {
      console.log('Fetching questions for test:', testId);
      const { data, error } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', testId);
        
      if (error) throw error;
      
      if (data) {
        console.log('Fetched questions:', data);
        const questions = data.map(q => ({
          id: q.id,
          question: q.question,
          options: Array.isArray(q.options) ? q.options.map(String) : [],
          answer: q.answer,
          explanation: q.explanation || ''
        }));
        
        setTestQuestions(questions);
        setHasLoadedQuestions(true);
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

  const handleDeleteQuestion = async (questionId: string) => {
    if (!testId) return;
    
    try {
      const { error } = await supabase
        .from('test_questions')
        .delete()
        .eq('id', questionId);
      
      if (error) throw error;
      
      setTestQuestions(prev => prev.filter(q => q.id !== questionId));
      
      toast({
        title: 'Question Deleted',
        description: 'The question has been successfully deleted',
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive',
      });
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
      
      if (field === 'answer') {
        return {...prev, [field]: Number(value)};
      }
      
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
          answer: Number(currentEditQuestion.answer),
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

  useEffect(() => {
    fetchTestData();
  }, [testId, user, navigate, toast]);

  useEffect(() => {
    if (activeTab === 'questions' && !hasLoadedQuestions && testId) {
      fetchTestQuestions();
    }
  }, [activeTab, hasLoadedQuestions, testId]);

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
        <p className="text-muted-foreground mb-6">
          The test you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate('/cbt')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto pb-10 md:pb-6 md:pl-0 pt-6">
      <TestHeader 
        testActive={testActive}
        toggleTestStatus={toggleTestStatus}
        deleteTest={deleteTest}
        deleteLoading={deleteLoading}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
      />
      
      <TestDetails 
        title={testDetails.title}
        description={testDetails.description}
        questionCount={testDetails.question_count}
        timeLimit={testDetails.time_limit}
        difficulty={testDetails.difficulty}
        shareCode={testDetails.share_code}
        createdAt={testDetails.created_at}
        formatDate={formatDate}
      />
      
      <Tabs 
        defaultValue="participants" 
        onValueChange={(value) => {
          setActiveTab(value);
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="participants">
          <ParticipantsList 
            testAttempts={testAttempts}
            downloadParticipantPDF={downloadParticipantPDF}
            disqualifyParticipant={disqualifyParticipant}
            reinstateParticipant={reinstateParticipant}
            disqualifying={disqualifying}
            refreshing={refreshing}
            refreshData={refreshData}
          />
        </TabsContent>
        
        <TabsContent value="questions">
          <QuestionsList 
            questions={testQuestions}
            loadingQuestions={loadingQuestions}
            handleEditQuestion={handleEditQuestion}
            handleDeleteQuestion={handleDeleteQuestion}
            fetchTestQuestions={() => {
              setHasLoadedQuestions(false);
              fetchTestQuestions();
            }}
          />
        </TabsContent>
      </Tabs>
      
      <div className="hidden">
        <div ref={certificateRef} className="certificate-container p-8 bg-white">
          {selectedParticipant && (
            <Certificate
              userName={selectedParticipant.participant_name || 'Anonymous'}
              achievementName={testDetails?.title || 'Test'}
              date={formatDate(selectedParticipant.completed_at)}
              score={Math.round((selectedParticipant.score / selectedParticipant.total_questions) * 100)}
              testDescription={testDetails?.description || undefined}
              disqualified={selectedParticipant.disqualified}
              position={getParticipantPosition(selectedParticipant.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTest;
