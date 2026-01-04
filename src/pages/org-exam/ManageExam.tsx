import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Copy, 
  Check,
  Play,
  Square,
  RefreshCw,
  Trash2,
  FileText,
  Users,
  Shield,
  BarChart3,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useOrgExam, OrgExam, OrgExamQuestion, OrgExamSession } from '@/hooks/useOrgExam';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function ManageOrgExam() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getExamById, getExamQuestions, getExamSessions, updateExam, deleteExam } = useOrgExam();
  
  const [exam, setExam] = useState<OrgExam | null>(null);
  const [questions, setQuestions] = useState<OrgExamQuestion[]>([]);
  const [sessions, setSessions] = useState<OrgExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    // ProtectedRoute handles auth - just load data if we have examId
    if (examId) {
      loadExamData();
    }
  }, [examId]);

  const loadExamData = async () => {
    if (!examId) return;
    
    setLoading(true);
    try {
      const [examData, questionsData, sessionsData] = await Promise.all([
        getExamById(examId),
        getExamQuestions(examId),
        getExamSessions(examId),
      ]);
      
      if (!examData) {
        toast.error('Exam not found');
        navigate('/org-exam');
        return;
      }
      
      setExam(examData);
      setQuestions(questionsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading exam:', error);
      toast.error('Failed to load exam data');
    } finally {
      setLoading(false);
    }
  };

  const copyAccessLink = () => {
    if (!exam) return;
    const link = `${window.location.origin}/org-exam/take/${exam.access_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Access link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus: 'active' | 'completed' | 'cancelled') => {
    if (!exam) return;
    
    setActionLoading(newStatus);
    try {
      const success = await updateExam(exam.id, { status: newStatus });
      if (success) {
        setExam(prev => prev ? { ...prev, status: newStatus } : null);
        toast.success(`Exam ${newStatus === 'active' ? 'activated' : newStatus}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!exam) return;
    
    const success = await deleteExam(exam.id);
    if (success) {
      navigate('/org-exam');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/org-exam')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{exam.title}</h1>
                <Badge className={statusColors[exam.status]}>
                  {exam.status}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {exam.subject} • {exam.question_count} questions • {exam.time_limit} minutes
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {exam.status === 'draft' && (
              <Button onClick={() => handleStatusChange('active')} disabled={!!actionLoading}>
                {actionLoading === 'active' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Activate Exam
              </Button>
            )}
            {exam.status === 'active' && (
              <Button variant="destructive" onClick={() => handleStatusChange('completed')} disabled={!!actionLoading}>
                {actionLoading === 'completed' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                End Exam
              </Button>
            )}
            <Button variant="outline" onClick={loadExamData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Access Code Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Access Code</p>
                <p className="text-2xl font-mono font-bold">{exam.access_code}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyAccessLink}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copy Link
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`/org-exam/take/${exam.access_code}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Questions ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subject</span>
                    <span className="font-medium">{exam.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Academic Level</span>
                    <span className="font-medium">{exam.academic_level?.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Curriculum</span>
                    <span className="font-medium">{exam.curriculum_type?.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Difficulty</span>
                    <span className="font-medium capitalize">{exam.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions</span>
                    <span className="font-medium">{exam.question_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Limit</span>
                    <span className="font-medium">{exam.time_limit} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{format(new Date(exam.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shuffle Questions</span>
                    <span className="font-medium">{exam.shuffle_questions ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shuffle Options</span>
                    <span className="font-medium">{exam.shuffle_options ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Violations</span>
                    <span className="font-medium">{exam.max_violations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Show Results</span>
                    <span className="font-medium">{exam.show_results_immediately ? 'Immediately' : 'Manual'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Late Entry</span>
                    <span className="font-medium">{exam.allow_late_entry ? 'Allowed' : 'Not Allowed'}</span>
                  </div>
                </CardContent>
              </Card>

              {exam.description && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{exam.description}</p>
                  </CardContent>
                </Card>
              )}

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Exam
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Examination?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this exam, all questions, and all participant data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle>Exam Questions</CardTitle>
                <CardDescription>
                  {questions.length} questions generated for this examination
                </CardDescription>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No questions found for this exam
                  </p>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, i) => (
                      <div key={q.id} className="p-4 border rounded-lg">
                        <p className="font-medium mb-2">
                          <span className="text-muted-foreground mr-2">Q{i + 1}.</span>
                          {q.question}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                          {q.options.map((opt, j) => (
                            <div 
                              key={j} 
                              className={`p-2 rounded text-sm ${j === q.answer ? 'bg-green-100 dark:bg-green-900/30 border-green-500 border' : 'bg-muted'}`}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + j)}.</span>
                              {opt}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="text-sm text-muted-foreground mt-3 italic">
                            Explanation: {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
                <CardDescription>
                  Students who have registered or taken this exam
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No participants yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Email</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Score</th>
                          <th className="text-left p-3 font-medium">Violations</th>
                          <th className="text-left p-3 font-medium">Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((session) => (
                          <tr key={session.id} className="border-b">
                            <td className="p-3">{session.student_name}</td>
                            <td className="p-3 text-muted-foreground">{session.student_email}</td>
                            <td className="p-3">
                              <Badge variant={session.status === 'submitted' ? 'default' : session.status === 'disqualified' ? 'destructive' : 'secondary'}>
                                {session.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {session.score !== null ? `${session.score}/${session.total_questions}` : '-'}
                            </td>
                            <td className="p-3">
                              <span className={session.violation_count > 0 ? 'text-destructive font-medium' : ''}>
                                {session.violation_count}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {session.submitted_at ? format(new Date(session.submitted_at), 'MMM d, HH:mm') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Results Summary</CardTitle>
                <CardDescription>
                  Performance analytics for this examination
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.filter(s => s.status === 'submitted').length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No submissions yet
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 border rounded-lg text-center">
                      <p className="text-3xl font-bold">
                        {sessions.filter(s => s.status === 'submitted').length}
                      </p>
                      <p className="text-muted-foreground">Submissions</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <p className="text-3xl font-bold">
                        {(() => {
                          const submitted = sessions.filter(s => s.status === 'submitted' && s.score !== null);
                          if (submitted.length === 0) return '-';
                          const avg = submitted.reduce((sum, s) => sum + (s.score || 0), 0) / submitted.length;
                          return avg.toFixed(1);
                        })()}
                      </p>
                      <p className="text-muted-foreground">Average Score</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <p className="text-3xl font-bold text-destructive">
                        {sessions.filter(s => s.status === 'disqualified').length}
                      </p>
                      <p className="text-muted-foreground">Disqualified</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
