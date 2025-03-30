
import React from 'react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Trophy, HelpCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
}) => {
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  let resultMessage = "Good effort!";
  let resultClass = "text-amber-500";
  
  if (percentage >= 80) {
    resultMessage = "Excellent work!";
    resultClass = "text-green-500";
  } else if (percentage < 50) {
    resultMessage = "Keep practicing!";
    resultClass = "text-rose-500";
  }

  const timeLimit = testDetails?.time_limit || location?.state?.settings?.timeLimit || 15;
  const timeTaken = timeLimit * 60 - timeRemaining;
  const timeEfficiency = Math.round((timeTaken / (timeLimit * 60)) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Quiz Results</CardTitle>
        </div>
        <CardDescription>
          {testDetails?.title || location?.state?.subject || testId} Quiz
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6">
        <div className="text-center mb-8">
          <Trophy className="mx-auto h-12 w-12 text-veno-primary mb-4" />
          <h2 className="text-3xl font-bold mb-2">{percentage}%</h2>
          <p className={`text-lg font-medium ${resultClass} mb-2`}>
            {resultMessage}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            You answered {score} out of {questions.length} questions correctly
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Quiz Statistics</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Score:</span>
                <span className="font-medium">{score}/{questions.length}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Percentage:</span>
                <span className="font-medium">{percentage}%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Correct answers:</span>
                <span className="font-medium text-green-600">{score}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Wrong answers:</span>
                <span className="font-medium text-red-600">{questions.length - score}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Time taken:</span>
                <span className="font-medium">
                  {formatTime(timeTaken)}
                </span>
              </li>
            </ul>
          </div>
          
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Performance Analysis</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span>{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Time Efficiency</span>
                  <span>{timeEfficiency}%</span>
                </div>
                <Progress value={timeEfficiency} className="h-2" />
              </div>
            </div>
          </div>
        </div>
        
        {testDetails?.results_visibility === 'public' && publicResults.length > 0 && (
          <div className="bg-secondary/30 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-3">Leaderboard</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Time (min)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicResults.map((result, index) => (
                    <TableRow key={result.id} className={
                      (result.participant_email === (testTakerInfo?.email || user?.email)) 
                        ? "bg-veno-primary/10" 
                        : ""
                    }>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        {result.participant_name || "Anonymous"}
                        {(result.participant_email === (testTakerInfo?.email || user?.email)) && 
                          " (You)"}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.score}/{result.total_questions}
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.floor(result.time_taken / 60)}:{(result.time_taken % 60).toString().padStart(2, '0')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
        <div className="bg-secondary/30 p-4 rounded-lg text-center">
          <h3 className="font-medium mb-2">Review Your Answers</h3>
          <p className="text-sm text-muted-foreground mb-2">
            See all questions, your answers, and the correct answers
          </p>
          <Button 
            onClick={onReviewAnswers}
            variant="outline" 
            className="text-veno-primary border-veno-primary/30"
          >
            <HelpCircle className="h-4 w-4 mr-2" /> 
            View Detailed Review
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex gap-4">
        <Button variant="outline" className="flex-1" onClick={onFinish}>
          Back to Tests
        </Button>
        {(testDetails?.allow_retakes || testId === 'subject') && (
          <Button 
            className="flex-1 bg-veno-primary hover:bg-veno-primary/90" 
            onClick={onTryAgain}
          >
            Try Again
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TestResults;
