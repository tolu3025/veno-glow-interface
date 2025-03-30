
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Loader2 } from 'lucide-react';
import { VenoLogo } from '@/components/ui/logo';
import { toast } from '@/hooks/use-toast';
import { useSubjects } from '@/hooks/useSubjects';
import { testSupabaseConnection } from '@/integrations/supabase/client';

// Import our new components
import ConnectionStatus from './quiz/ConnectionStatus';
import SubjectSelector from './quiz/SubjectSelector';
import DifficultySelector from './quiz/DifficultySelector';
import SliderControl from './quiz/SliderControl';

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all', label: 'All Levels' }
];

const QuizSection = () => {
  const navigate = useNavigate();
  const { data: subjects, isLoading, error, refetch, isError } = useSubjects();
  
  const [subject, setSubject] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [questionsCount, setQuestionsCount] = useState<number>(10);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  useEffect(() => {
    const checkConnection = async () => {
      const isOnline = navigator.onLine;
      
      if (isOnline) {
        setConnectionStatus('unknown');
        const result = await testSupabaseConnection();
        setConnectionStatus(result.success ? 'connected' : 'disconnected');
      } else {
        setConnectionStatus('disconnected');
      }
    };
    
    checkConnection();
    
    const handleOnline = () => checkConnection();
    const handleOffline = () => setConnectionStatus('disconnected');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (subjects && subjects.length > 0 && !subject) {
      setSubject('');
    }
  }, [subjects]);

  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Connection issue",
        description: "Using locally stored data. Some features may be limited.",
        variant: "warning",
      });
    }
  }, [isError, error]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setConnectionStatus('unknown');
    
    try {
      const result = await testSupabaseConnection();
      
      if (result.success) {
        await refetch();
        setConnectionStatus('connected');
        toast({
          title: "Connection restored",
          description: "Successfully reconnected to the database.",
        });
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "Still disconnected",
          description: "Could not establish connection to the database.",
          variant: "destructive",
        });
      }
    } catch (e) {
      setConnectionStatus('disconnected');
      toast({
        title: "Connection failed",
        description: "Could not connect to the database.",
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
        <ConnectionStatus 
          connectionStatus={connectionStatus}
          isRetrying={isRetrying}
          onRetry={handleRetry}
        />

        <SubjectSelector
          subjects={subjects}
          subject={subject}
          onSubjectChange={setSubject}
          isLoading={isLoading}
          isRetrying={isRetrying}
          connectionStatus={connectionStatus}
        />

        <DifficultySelector 
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          options={difficultyOptions}
        />

        <SliderControl
          label="Time Limit"
          value={timeLimit}
          onValueChange={setTimeLimit}
          min={5}
          max={40}
          step={5}
          unit="minutes"
          icon={<Clock className="h-5 w-5 text-veno-primary" />}
        />

        <SliderControl
          label="Number of Questions"
          value={questionsCount}
          onValueChange={setQuestionsCount}
          min={5}
          max={40}
          step={5}
          unit="questions"
        />
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
