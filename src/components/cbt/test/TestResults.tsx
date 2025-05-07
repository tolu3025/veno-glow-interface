
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleCheck, RotateCcw, ArrowLeft, Eye, Award, Clock, XCircle, Home } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import { VenoLogo } from '@/components/ui/logo';
import { soundSystem } from '@/utils/sound';

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
  onReviewAnswers: () => void;
  onFinish: () => void;
  onTryAgain: () => void;
  formatTime: (seconds: number) => string;
  savingError: string | null;
}

const TestResults = ({
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
  savingError
}: TestResultsProps) => {
  const percentScore = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const isPracticeQuiz = testId === 'subject' || location?.state?.subject;
  
  // Define getResultTitle function before using it
  const getResultTitle = (percent: number) => {
    if (percent >= 90) return "Excellent!";
    if (percent >= 70) return "Great job!";
    if (percent >= 50) return "Good effort!";
    return "Keep practicing!";
  };
  
  const resultTitle = getResultTitle(percentScore);
  
  // Play sound when results are shown
  useEffect(() => {
    if (percentScore >= 70) {
      soundSystem.play('success');
    } else if (percentScore >= 50) {
      soundSystem.play('notification');
    } else {
      soundSystem.play('error');
    }
  }, [percentScore]);

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Card className="relative overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-2">
            <VenoLogo className="h-8 w-8 text-primary mr-2" />
          </div>
          <CardTitle className="text-2xl font-bold">{resultTitle}</CardTitle>
          <p className="text-muted-foreground">
            You scored {score} out of {questions.length} questions
          </p>
          
          {savingError && (
            <div className="mt-2 flex items-center justify-center text-destructive gap-2 bg-destructive/10 p-2 rounded">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Failed to save results</span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-4 pb-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{percentScore}%</span>
                </div>
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-current text-muted"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-current text-primary"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${percentScore}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-secondary/20 p-3 rounded">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Time Spent:</span>
                </div>
                <p className="text-lg font-medium">
                  {formatTime((testDetails?.time_limit || 15) * 60 - timeRemaining)}
                </p>
              </div>
              
              <div className="bg-secondary/20 p-3 rounded">
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>Rank:</span>
                </div>
                <p className="text-lg font-medium">
                  {publicResults && publicResults.length > 0 
                    ? `${publicResults.findIndex(r => 
                        r.user_id === user?.id || 
                        r.participant_email === testTakerInfo?.email
                      ) + 1} of ${publicResults.length}`
                    : 'N/A'}
                </p>
              </div>
            </div>
            
            {publicResults && publicResults.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Top Performers</h3>
                <div className="max-h-36 overflow-y-auto pr-1">
                  {publicResults.slice(0, 5).map((result, index) => (
                    <div 
                      key={index}
                      className={`flex justify-between items-center p-2 rounded ${
                        (result.user_id === user?.id || 
                         result.participant_email === testTakerInfo?.email) ? 
                         'bg-primary/10' : 'odd:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="truncate max-w-[150px]">
                          {result.participant_name || result.participant_email || 'Anonymous'}
                        </span>
                      </div>
                      <span className="font-medium">
                        {Math.round((result.score / result.total_questions) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="flex flex-wrap gap-2 p-4 justify-center">
          <Button 
            variant="outline" 
            onClick={onReviewAnswers}
            className="flex gap-1 items-center sm:flex-1"
          >
            <Eye className="h-4 w-4" />
            Review Answers
          </Button>
          
          {isPracticeQuiz && (
            <Button 
              onClick={onTryAgain} 
              variant="outline"
              className="flex gap-1 items-center sm:flex-1"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          
          <Button 
            onClick={onFinish}
            className="gap-1 flex items-center sm:flex-1" 
          >
            <Home className="h-4 w-4" />
            Finish
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TestResults;
