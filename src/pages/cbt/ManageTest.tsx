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
  FileText
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
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const ManageTest = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [testDetails, setTestDetails] = useState<Test | null>(null);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [testActive, setTestActive] = useState(true);
  const [disqualifying, setDisqualifying] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${testDetails?.title || 'Test'} - Results`,
    removeAfterPrint: true,
    pageStyle: `
      @page { size: letter; margin: 0.5cm; }
      body { margin: 0; padding: 0; }
      header, footer, nav, button, .no-print { display: none !important; }
      .print-content { display: block !important; }
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

  const printParticipantResult = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setTimeout(() => {
      handlePrint();
    }, 300);
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
      
      <div className="hidden">
        <div ref={printRef} className="p-8 print-content">
          {selectedAttemptId && getSelectedParticipant() && (
            <Certificate 
              userName={getSelectedParticipant()?.participant_name || 'Anonymous'} 
              achievementName={`${testDetails.title} Assessment`}
              date={formatDate(getSelectedParticipant()!.completed_at)}
              score={Math.round((getSelectedParticipant()!.score / getSelectedParticipant()!.total_questions) * 100)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTest;
