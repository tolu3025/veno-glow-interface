import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

interface TestResultsProps {
  score: number;
  questions: any[];
  testDetails: any;
  timeRemaining: number;
  location: any;
  testId: string;
  publicResults: any[];
  testTakerInfo: any;
  user: any;
  onReviewAnswers?: () => void;
  onFinish: () => void;
  onTryAgain?: () => void;
  formatTime: (seconds: number) => string;
  savingError: string | null;
}

const TestResults: React.FC<TestResultsProps> = ({
  score,
  questions,
  testDetails,
  timeRemaining,
  location,
  testId,
  publicResults,
  testTakerInfo,
  user,
  onReviewAnswers,
  onFinish,
  onTryAgain,
  formatTime,
  savingError,
}) => {
  const navigate = useNavigate();
  const timeLimit = testDetails?.time_limit || location?.state?.settings?.timeLimit || 15;
  const timeTaken = timeLimit * 60 - timeRemaining;

  const userAnswers = questions.map((question: any) => {
    return question.selectedAnswer !== undefined ? question.selectedAnswer : null;
  });

  const handleViewExplanations = () => {
    navigate('/cbt/quiz-explanations', {
      state: {
        questions,
        userAnswers: userAnswers,
        score,
        testDetails
      }
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-veno-primary" />
          <CardTitle>Quiz Results</CardTitle>
        </div>
        <CardDescription>
          {testDetails?.title || location?.state?.subject || "Quiz"} - Your performance summary
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-veno-primary" />
              <h2 className="font-semibold">Final Score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)</h2>
            </div>
            <div className="text-sm text-muted-foreground">
              Time taken: {formatTime(timeTaken)}
            </div>
          </div>
          <Progress value={Math.round((score / questions.length) * 100)} className="h-2" />
        </div>
        
        <div className="space-y-4">
          {score === questions.length ? (
            <div className="rounded-md bg-green-50 p-4">
              <h3 className="text-sm font-medium text-green-800">Congratulations!</h3>
              <p className="mt-2 text-sm text-green-700">
                You aced the quiz with a perfect score. Keep up the excellent work!
              </p>
            </div>
          ) : score >= questions.length * 0.75 ? (
            <div className="rounded-md bg-blue-50 p-4">
              <h3 className="text-sm font-medium text-blue-800">Great Job!</h3>
              <p className="mt-2 text-sm text-blue-700">
                You performed very well. Review the questions you missed to improve further.
              </p>
            </div>
          ) : score >= questions.length * 0.5 ? (
            <div className="rounded-md bg-yellow-50 p-4">
              <h3 className="text-sm font-medium text-yellow-800">Good Effort</h3>
              <p className="mt-2 text-sm text-yellow-700">
                You passed the quiz. Focus on the areas where you can improve.
              </p>
            </div>
          ) : (
            <div className="rounded-md bg-red-50 p-4">
              <h3 className="text-sm font-medium text-red-800">Needs Improvement</h3>
              <p className="mt-2 text-sm text-red-700">
                You can do better. Review the material and try again.
              </p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 pt-4">
            <Button
              onClick={handleViewExplanations}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              View Explanations
            </Button>
            
            {onTryAgain && (
              <Button variant="secondary" onClick={onTryAgain}>
                Try Again
              </Button>
            )}
            {onReviewAnswers && (
              <Button onClick={onReviewAnswers} variant="secondary">
                Review Answers
              </Button>
            )}
            <Button className="bg-veno-primary hover:bg-veno-primary/90" onClick={onFinish}>
              Finish
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestResults;
