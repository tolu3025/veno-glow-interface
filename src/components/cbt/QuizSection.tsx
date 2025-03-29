import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Loader2 } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useAuth } from '@/providers/AuthProvider';
import { VenoLogo } from '@/components/ui/logo';
import QuizSettings, { QuizSettings as QuizSettingsType } from './QuizSettings';

const QuizSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subjects, isLoading, error } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

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
        <CardDescription>Explore subject quizzes from our database</CardDescription>
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
    </Card>
  );
};

export default QuizSection;
