
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { VenoLogo } from '@/components/ui/logo';
import { toast } from '@/hooks/use-toast';
import { useSubjects } from '@/hooks/useSubjects';
import { testSupabaseConnection, supabase } from '@/integrations/supabase/client';
import AdPlacement from '@/components/ads/AdPlacement';

// Import our components
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
  const [questionSource, setQuestionSource] = useState<string>('mixed');
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [userTestsCount, setUserTestsCount] = useState<number>(0);

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
    if (subject) {
      fetchUserTestsCount();
    }
  }, [subject]);

  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Connection issue",
        description: "Using locally stored questions. Some features may be limited.",
        variant: "warning",
      });
    }
  }, [isError, error]);

  const fetchUserTestsCount = async () => {
    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select('id')
        .eq('subject', subject);

      if (error) throw error;
      setUserTestsCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching user tests count:', error);
      setUserTestsCount(0);
    }
  };

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
          description: "Successfully reconnected to questions database.",
        });
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "Still disconnected",
          description: "Could not establish connection to the questions database.",
          variant: "destructive",
        });
      }
    } catch (e) {
      setConnectionStatus('disconnected');
      toast({
        title: "Connection failed",
        description: "Could not connect to the questions database.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const selectedSubjectData = subjects?.find(s => s.name === subject);
  const questionBankCount = selectedSubjectData?.question_count || 0;
  
  const getTotalAvailableQuestions = () => {
    switch (questionSource) {
      case 'question_bank':
        return questionBankCount;
      case 'user_tests':
        return userTestsCount;
      case 'mixed':
        return questionBankCount + userTestsCount;
      default:
        return questionBankCount + userTestsCount;
    }
  };

  const availableQuestions = getTotalAvailableQuestions();

  const handleStartQuiz = () => {
    if (!subject) {
      toast({
        title: "No subject selected",
        description: "Please select a subject from the available questions before starting the quiz",
        variant: "warning",
      });
      return;
    }

    if (availableQuestions < questionsCount) {
      toast({
        title: "Not enough questions",
        description: `Only ${availableQuestions} questions available for ${subject}. Please reduce the question count or select a different subject.`,
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
          questionsCount,
          questionSource
        }
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Enhanced Quiz Setup</CardTitle>
        </div>
        <CardDescription>
          Configure your quiz using questions from the question bank and user-created tests
        </CardDescription>
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

        {/* Subject validation feedback */}
        {subject && selectedSubjectData && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="text-sm text-green-700">
                <strong>{selectedSubjectData.name}</strong> selected
                <div className="text-xs text-green-600 mt-1">
                  Question Bank: {questionBankCount} | User Tests: {userTestsCount} | Total: {questionBankCount + userTestsCount}
                </div>
              </div>
            </div>

            {/* Question Source Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Question Source</label>
              <select 
                value={questionSource} 
                onChange={(e) => setQuestionSource(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="mixed">Mixed Sources ({questionBankCount + userTestsCount} total)</option>
                <option value="question_bank">Question Bank Only ({questionBankCount} questions)</option>
                <option value="user_tests">User Created Tests Only ({userTestsCount} questions)</option>
              </select>
            </div>
          </div>
        )}

        <DifficultySelector 
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          options={difficultyOptions}
        />

        <div className="my-4">
          <AdPlacement location="content" contentCheck={false} />
        </div>

        <SliderControl
          label="Time Limit"
          value={timeLimit}
          onValueChange={setTimeLimit}
          min={5}
          max={60}
          step={5}
          unit="minutes"
          icon={<Clock className="h-5 w-5 text-veno-primary" />}
        />

        <SliderControl
          label="Number of Questions"
          value={questionsCount}
          onValueChange={setQuestionsCount}
          min={5}
          max={Math.min(50, availableQuestions || 50)}
          step={5}
          unit="questions"
          disabled={!selectedSubjectData}
        />

        {/* Question availability warning */}
        {subject && selectedSubjectData && questionsCount > availableQuestions && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              Only {availableQuestions} questions available for {subject}. 
              Reduce question count to {availableQuestions} or less.
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-veno-primary hover:bg-veno-primary/90"
          onClick={handleStartQuiz}
          disabled={!subject || isLoading || isRetrying || (selectedSubjectData && questionsCount > availableQuestions)}
        >
          {isLoading || isRetrying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Questions from All Sources...
            </>
          ) : (
            <>
              <BookOpen className="mr-2 h-4 w-4" />
              Start Quiz {subject && selectedSubjectData ? `(${Math.min(questionsCount, availableQuestions)} questions)` : ''}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizSection;
