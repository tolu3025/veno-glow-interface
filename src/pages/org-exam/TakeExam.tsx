import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Clock, AlertTriangle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { useOrgExam, OrgExam, OrgExamQuestion, OrgExamSession } from '@/hooks/useOrgExam';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { toast } from 'sonner';

type ExamState = 'loading' | 'not_found' | 'registration' | 'instructions' | 'exam' | 'submitted' | 'disqualified';

export default function TakeOrgExam() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  const { getExamByAccessCode, getExamQuestions, createSession, updateSession, getSessionByEmail } = useOrgExam();
  
  const [state, setState] = useState<ExamState>('loading');
  const [exam, setExam] = useState<OrgExam | null>(null);
  const [questions, setQuestions] = useState<OrgExamQuestion[]>([]);
  const [session, setSession] = useState<OrgExamSession | null>(null);
  
  // Registration form
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [registering, setRegistering] = useState(false);
  
  // Exam state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  
  // Shuffle function
  const shuffleArray = <T,>(array: T[], seed: number): T[] => {
    const shuffled = [...array];
    let currentIndex = shuffled.length;
    let randomIndex;
    
    // Simple seeded random
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    while (currentIndex !== 0) {
      randomIndex = Math.floor(seededRandom() * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
    }
    
    return shuffled;
  };

  // Anti-cheat
  const handleViolation = useCallback((type: string, count: number) => {
    const messages: Record<string, string> = {
      'tab_switch': 'Leaving the exam tab is not allowed',
      'fullscreen_exit': 'You must remain in fullscreen mode',
      'right_click': 'Right-clicking is disabled during the exam',
      'copy_attempt': 'Copying is not allowed during the exam',
      'cut_attempt': 'Cutting is not allowed during the exam',
      'paste_attempt': 'Pasting is not allowed during the exam',
      'keyboard_shortcut': 'Keyboard shortcuts are disabled during the exam',
      'window_blur': 'Please keep focus on the exam window',
    };
    
    setViolationMessage(messages[type] || 'Security violation detected');
    setShowViolationWarning(true);
    
    if (exam && count >= exam.max_violations) {
      handleDisqualification();
    }
  }, [exam]);

  const handleDisqualification = useCallback(async () => {
    if (!session) return;
    
    await updateSession(session.id, { status: 'disqualified' });
    setState('disqualified');
    toast.error('You have been disqualified due to too many violations');
  }, [session, updateSession]);

  const { requestFullscreen, exitFullscreen } = useAntiCheat({
    sessionId: session?.id || '',
    maxViolations: exam?.max_violations || 5,
    onViolation: handleViolation,
    onDisqualify: handleDisqualification,
    enabled: state === 'exam',
  });

  // Load exam data
  useEffect(() => {
    const loadExam = async () => {
      if (!accessCode) {
        setState('not_found');
        return;
      }
      
      const examData = await getExamByAccessCode(accessCode);
      if (!examData) {
        setState('not_found');
        return;
      }
      
      if (examData.status !== 'active' && examData.status !== 'scheduled') {
        toast.error('This exam is not currently available');
        setState('not_found');
        return;
      }
      
      setExam(examData);
      
      const questionsData = await getExamQuestions(examData.id);
      
      // Shuffle questions if enabled
      let processedQuestions = [...questionsData];
      if (examData.shuffle_questions) {
        processedQuestions = shuffleArray(processedQuestions, Date.now());
      }
      
      // Shuffle options if enabled
      if (examData.shuffle_options) {
        processedQuestions = processedQuestions.map(q => {
          const optionsWithIndices = q.options.map((opt, idx) => ({ opt, originalIdx: idx }));
          const shuffledOptions = shuffleArray(optionsWithIndices, Date.now() + q.order_index);
          const newAnswer = shuffledOptions.findIndex(o => o.originalIdx === q.answer);
          return {
            ...q,
            options: shuffledOptions.map(o => o.opt),
            answer: newAnswer,
          };
        });
      }
      
      setQuestions(processedQuestions);
      setAnswers(new Array(processedQuestions.length).fill(null));
      setState('registration');
    };
    
    loadExam();
  }, [accessCode, getExamByAccessCode, getExamQuestions]);

  // Timer
  useEffect(() => {
    if (state !== 'exam' || !exam) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [state, exam]);

  const handleRegistration = async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      toast.error('Please enter your name and email');
      return;
    }
    
    if (!exam) return;
    
    setRegistering(true);
    try {
      // Check for existing session
      const existingSession = await getSessionByEmail(exam.id, studentEmail);
      if (existingSession) {
        if (existingSession.status === 'submitted') {
          toast.error('You have already submitted this exam');
          return;
        }
        if (existingSession.status === 'disqualified') {
          toast.error('You have been disqualified from this exam');
          return;
        }
        // Resume session
        setSession(existingSession);
        if (existingSession.answers) {
          setAnswers(existingSession.answers as (number | null)[]);
        }
        setState('instructions');
        return;
      }
      
      // Create new session
      const newSession = await createSession({
        exam_id: exam.id,
        student_name: studentName,
        student_email: studentEmail,
        student_id: studentId || null,
        status: 'registered',
      });
      
      if (newSession) {
        setSession(newSession);
        setState('instructions');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register for exam');
    } finally {
      setRegistering(false);
    }
  };

  const handleStartExam = async () => {
    if (!session || !exam) return;
    
    await updateSession(session.id, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });
    
    setTimeRemaining(exam.time_limit * 60);
    requestFullscreen();
    setState('exam');
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
    
    // Save progress periodically
    if (session) {
      updateSession(session.id, { answers: newAnswers });
    }
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentQuestion)) {
      newFlagged.delete(currentQuestion);
    } else {
      newFlagged.add(currentQuestion);
    }
    setFlagged(newFlagged);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!session || !exam) return;
    
    setSubmitting(true);
    try {
      // Calculate score
      let correctCount = 0;
      questions.forEach((q, i) => {
        if (answers[i] === q.answer) {
          correctCount++;
        }
      });
      
      const timeTaken = exam.time_limit * 60 - timeRemaining;
      
      await updateSession(session.id, {
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        score: correctCount,
        total_questions: questions.length,
        answers: answers,
        time_taken: timeTaken,
      });
      
      setScore(correctCount);
      exitFullscreen();
      setState('submitted');
      
      if (autoSubmit) {
        toast.info('Time expired. Your exam has been automatically submitted.');
      } else {
        toast.success('Exam submitted successfully');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit exam');
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = answers.filter(a => a !== null).length;

  // Render based on state
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading examination...</p>
        </div>
      </div>
    );
  }

  if (state === 'not_found') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Exam Not Found</CardTitle>
            <CardDescription>
              This exam is not available or the access code is invalid
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'registration') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{exam?.title}</CardTitle>
            <CardDescription>
              Enter your details to register for this examination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID (Optional)</Label>
              <Input
                id="studentId"
                placeholder="Enter your student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleRegistration}
              disabled={registering}
            >
              {registering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Continue to Instructions'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'instructions') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle>Examination Instructions</CardTitle>
            <CardDescription>{exam?.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">Subject</p>
                <p className="font-medium">{exam?.subject}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{exam?.time_limit} minutes</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">Questions</p>
                <p className="font-medium">{questions.length}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">Max Violations</p>
                <p className="font-medium">{exam?.max_violations}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <h4 className="font-medium">Important Rules:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>The exam will run in fullscreen mode</li>
                <li>Do not switch tabs or windows during the exam</li>
                <li>Right-clicking and copying are disabled</li>
                <li>Keyboard shortcuts are restricted</li>
                <li>Exceeding the maximum violations will result in disqualification</li>
                <li>The exam will auto-submit when time expires</li>
              </ul>
            </div>

            {exam?.instructions && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Additional Instructions:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {exam.instructions}
                </p>
              </div>
            )}

            <Button className="w-full" onClick={handleStartExam}>
              Begin Examination
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'submitted') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Examination Submitted</CardTitle>
            <CardDescription>
              Your responses have been recorded successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {exam?.show_results_immediately && score !== null && (
              <div className="p-6 bg-muted rounded-lg">
                <p className="text-muted-foreground mb-2">Your Score</p>
                <p className="text-4xl font-bold">
                  {score} / {questions.length}
                </p>
                <p className="text-lg text-muted-foreground mt-1">
                  ({((score / questions.length) * 100).toFixed(1)}%)
                </p>
              </div>
            )}
            <Button onClick={() => navigate('/')}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'disqualified') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>Disqualified</CardTitle>
            <CardDescription>
              You have been disqualified from this examination due to security violations
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main exam interface
  const currentQ = questions[currentQuestion];
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-semibold">{exam?.title}</h1>
          <p className="text-sm text-muted-foreground">{exam?.subject}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={timeRemaining < 300 ? 'destructive' : 'secondary'} className="text-lg px-4 py-1">
            <Clock className="h-4 w-4 mr-2" />
            {formatTime(timeRemaining)}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center justify-between text-sm mb-1">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} className="h-2" />
      </div>

      {/* Question */}
      <div className="flex-1 p-4 overflow-auto">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="outline" className="mb-2">Question {currentQuestion + 1}</Badge>
                <CardTitle className="text-lg leading-relaxed">
                  {currentQ.question}
                </CardTitle>
              </div>
              <Button
                variant={flagged.has(currentQuestion) ? 'default' : 'outline'}
                size="icon"
                onClick={toggleFlag}
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQ.options.map((option, idx) => (
              <div
                key={idx}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  answers[currentQuestion] === idx
                    ? 'border-primary bg-primary/10'
                    : 'hover:bg-accent'
                }`}
                onClick={() => handleAnswerSelect(idx)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm font-medium ${
                    answers[currentQuestion] === idx
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-muted-foreground'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Question Navigation */}
      <div className="border-t bg-card p-4">
        <div className="max-w-3xl mx-auto">
          {/* Question buttons */}
          <div className="flex flex-wrap gap-1 mb-4 justify-center">
            {questions.map((_, idx) => (
              <Button
                key={idx}
                variant={idx === currentQuestion ? 'default' : answers[idx] !== null ? 'secondary' : 'outline'}
                size="sm"
                className={`w-8 h-8 p-0 ${flagged.has(idx) ? 'ring-2 ring-orange-500' : ''}`}
                onClick={() => setCurrentQuestion(idx)}
              >
                {idx + 1}
              </Button>
            ))}
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentQuestion === questions.length - 1 ? (
              <Button onClick={() => setShowSubmitDialog(true)}>
                Submit Examination
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Examination?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="text-destructive block mt-2">
                  Warning: You have {questions.length - answeredCount} unanswered questions.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit()} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Violation Warning */}
      <AlertDialog open={showViolationWarning} onOpenChange={setShowViolationWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Security Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              {violationMessage}. This violation has been recorded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowViolationWarning(false);
              requestFullscreen();
            }}>
              Continue Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
