
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Loader2, LibraryIcon } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useAuth } from '@/providers/AuthProvider';
import { VenoLogo } from '@/components/ui/logo';
import QuizSettings, { QuizSettings as QuizSettingsType } from './QuizSettings';

const QuizSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subjects, isLoading, error } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor online status
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleStartQuiz = (subject: string) => {
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
        <CardContent className="text-center py-8">
          <div className="mb-4 text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
              <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">No internet connection</p>
          <p className="text-muted-foreground mb-4">Please check your connection to access quizzes</p>
          <Button onClick={() => window.location.reload()}>
            Reload
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error || !subjects || subjects.length === 0) {
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
          <div className="text-center py-8">
            <p className="text-muted-foreground">No subjects available at the moment.</p>
            {user && (
              <Button className="mt-4" onClick={() => navigate('/cbt/create')}>
                Create a Quiz
              </Button>
            )}
          </div>
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
};

export default QuizSection;
