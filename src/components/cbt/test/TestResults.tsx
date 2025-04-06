
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Trophy, HelpCircle, FileText, Award, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

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
  savingError?: string | null;
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
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  
  let resultMessage = "Good effort!";
  let resultClass = "text-amber-500";
  let resultEmoji = "🎯";
  
  if (percentage >= 90) {
    resultMessage = "Outstanding!";
    resultClass = "text-emerald-500";
    resultEmoji = "🏆";
  } else if (percentage >= 80) {
    resultMessage = "Excellent work!";
    resultClass = "text-green-500";
    resultEmoji = "🌟";
  } else if (percentage >= 70) {
    resultMessage = "Great job!";
    resultClass = "text-lime-500";
    resultEmoji = "👏";
  } else if (percentage >= 60) {
    resultMessage = "Good progress!";
    resultClass = "text-blue-500";
    resultEmoji = "👍";
  } else if (percentage >= 50) {
    resultMessage = "Good effort!";
    resultClass = "text-amber-500";
    resultEmoji = "🎯";
  } else if (percentage >= 40) {
    resultMessage = "Keep practicing!";
    resultClass = "text-orange-500";
    resultEmoji = "🔄";
  } else {
    resultMessage = "Don't give up!";
    resultClass = "text-rose-500";
    resultEmoji = "💪";
  }

  const timeLimit = testDetails?.time_limit || location?.state?.settings?.timeLimit || 15;
  const timeTaken = timeLimit * 60 - timeRemaining;
  const timeEfficiency = Math.round((timeTaken / (timeLimit * 60)) * 100);
  
  const resultRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    console.log("TestResults rendered with:", {
      testDetails,
      resultsVisibility: testDetails?.results_visibility,
      isCreator: user?.id === testDetails?.creator_id,
      publicResultsCount: publicResults?.length,
      testTakerInfo
    });
  }, [testDetails, publicResults, testTakerInfo, user]);
  
  const findRank = () => {
    if (!publicResults || publicResults.length === 0) return "N/A";
    
    const sortedResults = [...publicResults].sort((a, b) => 
      (b.score / b.total_questions) - (a.score / a.total_questions)
    );
    
    const userEmail = testTakerInfo?.email || user?.email;
    const position = sortedResults.findIndex(result => result.participant_email === userEmail) + 1;
    
    if (position === 0) return "N/A";
    if (position === 1) return "1st 🥇";
    if (position === 2) return "2nd 🥈";
    if (position === 3) return "3rd 🥉";
    return `${position}th`;
  }

  const getProgressColorClass = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  // Test creator can always see results, regardless of visibility settings
  const isCreator = user?.id === testDetails?.creator_id;
  
  const shouldShowLeaderboard = 
    isCreator || 
    (testDetails?.results_visibility === 'public') || 
    (testDetails?.results_visibility === 'test_takers' && testTakerInfo);

  return (
    <div>
      <div ref={resultRef}>
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <VenoLogo className="h-6 w-6" />
              <CardTitle>Quiz Results</CardTitle>
            </div>
            <CardDescription>
              {testDetails?.title || location?.state?.subject || testId} Quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-6">
            <div className="bg-card border rounded-lg p-6 mb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary/20 rounded-full mb-4">
                  <Trophy className="h-10 w-10 text-veno-primary" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-3xl font-bold">{percentage}%</h2>
                  <span className="text-2xl">{resultEmoji}</span>
                </div>
                <p className={`text-lg font-medium ${resultClass} mb-2`}>
                  {resultMessage}
                </p>
                <p className="text-sm text-muted-foreground">
                  You answered {score} out of {questions.length} questions correctly
                </p>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <div className="bg-secondary/30 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center">
                  <Award className="h-4 w-4 mr-2 text-veno-primary" />
                  Quiz Statistics
                </h3>
                <ul className="space-y-3">
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
                    <span className="font-medium text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {score}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Wrong answers:</span>
                    <span className="font-medium text-red-600 flex items-center">
                      <XCircle className="h-3 w-3 mr-1" />
                      {questions.length - score}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Time taken:</span>
                    <span className="font-medium flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(timeTaken)}
                    </span>
                  </li>
                  {findRank() !== "N/A" && (
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Rank:</span>
                      <span className="font-medium">{findRank()}</span>
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="bg-secondary/30 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Performance Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Accuracy</span>
                      <Badge variant={percentage >= 70 ? "default" : percentage >= 50 ? "secondary" : "outline"}>
                        {percentage}%
                      </Badge>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={`h-2 ${getProgressColorClass(percentage)}`}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Time Efficiency</span>
                      <Badge variant={timeEfficiency <= 80 ? "default" : "secondary"}>
                        {timeEfficiency}%
                      </Badge>
                    </div>
                    <Progress value={timeEfficiency} className="h-2" />
                  </div>
                  
                  <div className="pt-2">
                    <Separator className="my-2" />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {percentage >= 80 && (
                        <Badge className="bg-green-500">
                          Excellent
                        </Badge>
                      )}
                      {percentage >= 70 && percentage < 80 && (
                        <Badge className="bg-blue-500">
                          Good
                        </Badge>
                      )}
                      {percentage >= 50 && percentage < 70 && (
                        <Badge className="bg-amber-500">
                          Average
                        </Badge>
                      )}
                      {percentage < 50 && (
                        <Badge className="bg-red-500">
                          Needs Improvement
                        </Badge>
                      )}
                      {timeEfficiency <= 60 && (
                        <Badge className="bg-green-500">
                          Time Efficient
                        </Badge>
                      )}
                      {timeEfficiency > 60 && timeEfficiency <= 80 && (
                        <Badge className="bg-amber-500">
                          Average Pace
                        </Badge>
                      )}
                      {timeEfficiency > 80 && (
                        <Badge className="bg-blue-500">
                          Thorough
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {shouldShowLeaderboard && publicResults && publicResults.length > 0 && (
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
                          <TableCell className="font-medium">
                            {index + 1}
                            {index === 0 && " 🥇"}
                            {index === 1 && " 🥈"}
                            {index === 2 && " 🥉"}
                          </TableCell>
                          <TableCell>
                            {result.participant_name || "Anonymous"}
                            {(result.participant_email === (testTakerInfo?.email || user?.email)) && 
                              " (You)"}
                          </TableCell>
                          <TableCell className="text-right">
                            {Math.round((result.score / result.total_questions) * 100)}%
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
          <CardFooter className="flex flex-col gap-4">
            <div className="flex flex-col w-full gap-4">
              <div className="grid grid-cols-2 gap-2 w-full">
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
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default TestResults;
