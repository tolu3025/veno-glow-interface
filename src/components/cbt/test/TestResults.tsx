
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Trophy, HelpCircle, FileText, Award, CheckCircle, XCircle, Clock, BarChart2, Medal, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
            
            {/* Leaderboard Section - Only show when results_visibility is public */}
            {testDetails?.results_visibility === 'public' && publicResults && publicResults.length > 0 && (
              <div className="bg-secondary/30 p-4 rounded-lg mb-8">
                <h3 className="font-medium mb-3 flex items-center">
                  <Trophy className="h-4 w-4 mr-2 text-veno-primary" />
                  Leaderboard
                </h3>
                
                {/* Top 3 performers highlight (if at least 3 participants) */}
                {publicResults.length >= 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {/* 2nd place */}
                    <div className="bg-secondary/30 rounded-lg p-3 text-center order-2 md:order-1">
                      <div className="flex justify-center mb-1">
                        <div className="bg-secondary/50 rounded-full p-2">
                          <Medal className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                      <Badge className="mb-1 bg-blue-500">2nd Place</Badge>
                      <h3 className="font-medium text-sm truncate mt-1">
                        {publicResults[1]?.participant_name || "Anonymous"}
                      </h3>
                      <p className="text-xl font-bold">
                        {Math.round((publicResults[1]?.score / publicResults[1]?.total_questions) * 100)}%
                      </p>
                    </div>

                    {/* 1st place */}
                    <div className="bg-secondary/30 rounded-lg p-3 text-center order-1 md:order-2 ring-2 ring-primary/20">
                      <div className="flex justify-center mb-1">
                        <div className="bg-primary/20 rounded-full p-2">
                          <Trophy className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <Badge className="mb-1 bg-primary">1st Place</Badge>
                      <h3 className="font-medium truncate mt-1">
                        {publicResults[0]?.participant_name || "Anonymous"}
                      </h3>
                      <p className="text-2xl font-bold">
                        {Math.round((publicResults[0]?.score / publicResults[0]?.total_questions) * 100)}%
                      </p>
                    </div>

                    {/* 3rd place */}
                    <div className="bg-secondary/30 rounded-lg p-3 text-center order-3">
                      <div className="flex justify-center mb-1">
                        <div className="bg-secondary/50 rounded-full p-2">
                          <Medal className="h-5 w-5 text-amber-500" />
                        </div>
                      </div>
                      <Badge className="mb-1 bg-amber-500">3rd Place</Badge>
                      <h3 className="font-medium text-sm truncate mt-1">
                        {publicResults[2]?.participant_name || "Anonymous"}
                      </h3>
                      <p className="text-xl font-bold">
                        {Math.round((publicResults[2]?.score / publicResults[2]?.total_questions) * 100)}%
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Full Leaderboard */}
                <div className="rounded-lg border overflow-hidden mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rank</TableHead>
                        <TableHead>Participant</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publicResults.slice(0, 10).map((entry, index) => (
                        <TableRow key={entry.id} className={entry.participant_email === (testTakerInfo?.email || user?.email) ? "bg-primary/10" : ""}>
                          <TableCell className="font-medium">
                            {index + 1}
                            {index === 0 && " 🥇"}
                            {index === 1 && " 🥈"}
                            {index === 2 && " 🥉"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>
                                  {entry.participant_name?.[0]?.toUpperCase() || "A"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{entry.participant_name || "Anonymous"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {Math.round((entry.score / entry.total_questions) * 100)}%
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            {entry.time_taken ? formatTime(entry.time_taken) : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {publicResults.length > 10 && (
                  <div className="text-center mt-3">
                    <Link to={`/cbt/leaderboard/${testId}`}>
                      <Button variant="link" size="sm" className="text-primary">
                        View Full Leaderboard
                      </Button>
                    </Link>
                  </div>
                )}
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
