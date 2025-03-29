
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Star } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useAuth } from '@/providers/AuthProvider';

const QuizSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subjects, isLoading, error } = useSubjects();

  const handleStartQuiz = (subject: string) => {
    // Navigate to take test page with the subject
    navigate(`/cbt/take/subject`, { state: { subject } });
  };

  if (isLoading) {
    return (
      <div className="flex w-full justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !subjects || subjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Library</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Library</CardTitle>
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
