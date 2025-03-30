
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
import { BookOpen, Clock, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { VenoLogo } from '@/components/ui/logo';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSubjects } from '@/hooks/useSubjects';

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all', label: 'All Levels' }
];

const QuizSection = () => {
  const navigate = useNavigate();
  const { data: subjects, isLoading, error, refetch } = useSubjects();
  
  const [subject, setSubject] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [questionsCount, setQuestionsCount] = useState<number>(10);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Check network connection
  useEffect(() => {
    setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected');
    
    const handleOnline = () => setConnectionStatus('connected');
    const handleOffline = () => setConnectionStatus('disconnected');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset subject selection if subjects change
  useEffect(() => {
    if (subjects && subjects.length > 0 && !subject) {
      setSubject('');
    }
  }, [subjects]);

  // Show error toast if subjects loading fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading subjects",
        description: "Failed to load available subjects. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refetch();
      toast({
        title: "Retry successful",
        description: "Reconnected to the database successfully.",
      });
    } catch (e) {
      toast({
        title: "Retry failed",
        description: "Still unable to connect to the database. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleStartQuiz = () => {
    if (!subject) {
      toast({
        title: "No subject selected",
        description: "Please select a subject before starting the quiz",
        variant: "warning",
      });
      return;
    }

    navigate(`/cbt/take/subject`, { 
      state: { 
        subject: subject,
        settings: {
          difficulty,
          timeLimit,
          questionsCount
        }
      }
    });
  };

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
        {/* Connection Status */}
        {connectionStatus === 'disconnected' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Connection unavailable. Some subjects may not be displayed.
              </p>
            </div>
            <div className="flex justify-end mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry} 
                disabled={isRetrying}
                className="border-yellow-300 dark:border-yellow-700"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" /> Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" /> Retry Connection
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Subject Selector */}
        <div className="space-y-3">
          <Label htmlFor="subject">Pick Subject</Label>
          
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {isLoading || isRetrying ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-veno-primary mr-2" />
                  <span>Loading subjects...</span>
                </div>
              ) : subjects && subjects.length > 0 ? (
                subjects.map((subj) => (
                  <SelectItem key={subj.name} value={subj.name}>
                    {subj.name} ({subj.question_count} questions)
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No subjects available
                </div>
              )}
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
          disabled={!subject || isLoading || isRetrying}
        >
          {isLoading || isRetrying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <BookOpen className="mr-2 h-4 w-4" />
              Start Quiz
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizSection;
