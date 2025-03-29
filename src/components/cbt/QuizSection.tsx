
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useAuth } from '@/providers/AuthProvider';
import { VenoLogo } from '@/components/ui/logo';
import QuizSettings, { QuizSettings as QuizSettingsType } from './QuizSettings';
import { toast } from '@/hooks/use-toast';

const QuizSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subjects, isLoading, error, refetch } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  const handleStartQuiz = (subject: string) => {
    if (isOffline) {
      toast({
        title: "Network issue",
        description: "You appear to be offline. Quiz data may be limited.",
        variant: "warning",
      });
    }
    setSelectedSubject(subject);
  };

  const handleSettingsConfirm = (settings: QuizSettingsType) => {
    navigate(`/cbt/take/subject`, { 
      state: { 
        subject: selectedSubject,
        settings
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex w-full justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-veno-primary" />
      </div>
    );
  }

  // Instead of showing an error state, we now always have fallback data
  // But we'll show a warning if we're offline
  if (isOffline) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <VenoLogo className="h-6 w-6" />
            <CardTitle>Quiz Library</CardTitle>
          </div>
          <CardDescription>Explore subject quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 dark:bg-yellow-900/20 dark:border-yellow-600">
            <div className="flex items-center">
              <WifiOff className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                You're currently offline. Showing locally cached subjects.
              </p>
            </div>
          </div>
          {renderSubjectsGrid(subjects || [])}
        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              Need study materials?
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/cbt/library')}
              className="gap-2"
            >
              <BookOpen size={16} />
              Visit Library
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  }

  if (selectedSubject) {
    return (
      <QuizSettings 
        subject={selectedSubject}
        onStartQuiz={handleSettingsConfirm}
        onBack={() => setSelectedSubject(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Quiz Library</CardTitle>
        </div>
        <CardDescription>
          Explore subject quizzes from our database
          <Button 
            variant="link" 
            className="text-veno-primary p-0 h-auto font-medium ml-2"
            onClick={() => navigate('/cbt/library')}
          >
            Visit our Educational Library
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderSubjectsGrid(subjects || [])}
      </CardContent>
      <CardFooter className="border-t bg-muted/50 px-6 py-4">
        <div className="flex items-center justify-between w-full">
          <p className="text-sm text-muted-foreground">
            Need study materials?
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/cbt/library')}
            className="gap-2"
          >
            <BookOpen size={16} />
            Visit Library
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  function renderSubjectsGrid(subjects: any[]) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <Card key={subject.name} className="overflow-hidden">
            <div className="bg-primary/10 p-2">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{subject.name}</CardTitle>
                <CardDescription>
                  {subject.question_count} Questions
                </CardDescription>
              </CardHeader>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center">
                  <BookOpen className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>Multiple Choice</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>15 mins</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 p-4">
              <Button 
                className="w-full" 
                onClick={() => handleStartQuiz(subject.name)}
              >
                Start Quiz
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
};

export default QuizSection;
