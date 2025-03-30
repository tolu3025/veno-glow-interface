
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Loader2, AlertCircle, WifiOff, RefreshCw, DatabaseIcon } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useAuth } from '@/providers/AuthProvider';
import { VenoLogo } from '@/components/ui/logo';
import QuizSettings, { QuizSettings as QuizSettingsType } from './QuizSettings';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
            <CardTitle>Quiz Library</CardTitle>
          </div>
          <CardDescription>Explore subject quizzes</CardDescription>
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
        {subjects && subjects.length > 0 ? (
          renderSubjectsGrid(subjects)
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-2">No subjects found</h3>
            <p className="text-muted-foreground mb-4">
              There are no subjects available in the database.
            </p>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="flex items-center mx-auto gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        )}
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
