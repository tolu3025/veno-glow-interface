
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2, AlertCircle, RefreshCw, BookOpen, Clock } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useAuth } from '@/providers/AuthProvider';
import { VenoLogo } from '@/components/ui/logo';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all', label: 'All Levels' }
];

const QuizSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    data: subjects, 
    isLoading, 
    error, 
    refetch, 
    isError,
    isRefetching,
    failureCount 
  } = useSubjects();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [questionsCount, setQuestionsCount] = useState<number>(10);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      refetch(); // Refetch when coming back online
    };
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetch]);

  // When the subject data changes, log it
  useEffect(() => {
    if (subjects) {
      console.log('Available subjects:', subjects);
    }
  }, [subjects]);

  const handleStartQuiz = () => {
    if (!selectedSubject) {
      toast({
        title: "No subject selected",
        description: "Please select a subject before starting the quiz",
        variant: "warning",
      });
      return;
    }

    if (isOffline) {
      toast({
        title: "Network issue",
        description: "You appear to be offline. Quiz data may be limited.",
        variant: "warning",
      });
    }

    navigate(`/cbt/take/subject`, { 
      state: { 
        subject: selectedSubject,
        settings: {
          difficulty,
          timeLimit,
          questionsCount
        }
      }
    });
  };

  if (isLoading || isRefetching) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-veno-primary mb-3" />
          <p className="text-muted-foreground">Loading subjects...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError || error) {
    let errorMessage = "Failed to load subjects from the database.";
    let isConnectionError = false;

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') || 
          error.message.includes('network') || 
          error.message.includes('offline')) {
        isConnectionError = true;
        errorMessage = "Connection issue. Please check your internet connection.";
      } else if (error.message.includes('not found') || error.message.includes('No subjects')) {
        errorMessage = "No subjects found in database. Please check if there are any questions available.";
      } else if (error.message.includes('Database error')) {
        errorMessage = "Database issue. There might be a problem with the database configuration.";
      }
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <VenoLogo className="h-6 w-6" />
            <CardTitle>Quiz Setup</CardTitle>
          </div>
          <CardDescription>Configure your quiz preferences</CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {isOffline 
                ? "You're currently offline. Please check your internet connection."
                : errorMessage}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center mt-6">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="flex items-center gap-2"
              disabled={isRefetching}
            >
              {isRefetching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw size={16} className="mr-2" />
              )}
              Retry Loading Subjects
            </Button>
          </div>
          {failureCount > 2 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                If the problem persists, please contact support.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Quiz Setup</CardTitle>
        </div>
        <CardDescription>Configure your quiz settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subject Selection */}
        <div className="space-y-3">
          <Label htmlFor="subject">Select Subject</Label>
          <Select onValueChange={setSelectedSubject} value={selectedSubject || undefined}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects && subjects.map((subject) => (
                <SelectItem key={subject.name} value={subject.name}>
                  {subject.name} ({subject.question_count} questions)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Level */}
        <div className="space-y-3">
          <Label>Difficulty Level</Label>
          <RadioGroup
            value={difficulty}
            onValueChange={setDifficulty}
            className="grid grid-cols-2 gap-4"
          >
            {difficultyOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Time Limit */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-veno-primary" />
            <Label>Time Limit: {timeLimit} minutes</Label>
          </div>
          <div className="space-y-4">
            <Slider
              value={[timeLimit]}
              max={40}
              min={5}
              step={5}
              onValueChange={(value) => setTimeLimit(value[0])}
              className="w-full"
            />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">5 min</span>
              <span className="text-sm font-medium">{timeLimit} minutes</span>
              <span className="text-sm text-muted-foreground">40 min</span>
            </div>
          </div>
        </div>

        {/* Number of Questions */}
        <div className="space-y-3">
          <Label>Number of Questions: {questionsCount}</Label>
          <div className="space-y-4">
            <Slider
              value={[questionsCount]}
              max={40}
              min={5}
              step={5}
              onValueChange={(value) => setQuestionsCount(value[0])}
              className="w-full"
            />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">5</span>
              <span className="text-sm font-medium">{questionsCount} questions</span>
              <span className="text-sm text-muted-foreground">40</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-veno-primary hover:bg-veno-primary/90"
          onClick={handleStartQuiz}
          disabled={!selectedSubject}
        >
          Start Quiz
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizSection;
