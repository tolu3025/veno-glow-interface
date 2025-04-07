import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, HelpCircle, RefreshCcw, Users } from "lucide-react";
import { Link } from 'react-router-dom';

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
  savingError
}) => {
  const percentage = Math.round((score / questions.length) * 100);
  const timeTaken = (testDetails?.time_limit || 15) * 60 - timeRemaining;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Test Results</CardTitle>
          <CardDescription>Here's how you performed on the test.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-100/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Score
                </CardTitle>
                <CardDescription>Your performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{score} / {questions.length}</div>
                <div className="text-sm text-muted-foreground">{percentage}%</div>
              </CardContent>
            </Card>

            <Card className="bg-blue-100/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Time Taken
                </CardTitle>
                <CardDescription>Total time spent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatTime(timeTaken)}</div>
                <div className="text-sm text-muted-foreground">
                  {testDetails?.time_limit} minutes allocated
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-secondary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-secondary-foreground" />
                Summary
              </CardTitle>
              <CardDescription>Quick overview of your test</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5">
                <li>You answered {score} questions correctly out of {questions.length}.</li>
                <li>You completed the test in {formatTime(timeTaken)}.</li>
                <li>
                  {testDetails?.description || "No description provided for this test."}
                </li>
              </ul>
            </CardContent>
          </Card>

          {testDetails?.results_visibility === 'public' && publicResults.length > 0 && (
            <Card className="bg-secondary/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-secondary-foreground" />
                    <CardTitle>Leaderboard</CardTitle>
                  </div>
                </div>
                <CardDescription>See how you rank against other participants.</CardDescription>
              </CardHeader>
              <CardContent>
                {publicResults.length > 0 ? (
                  <ol className="list-decimal pl-5">
                    {publicResults.slice(0, 5).map((result, index) => (
                      <li key={result.id} className="py-1">
                        {result.participant_name || "Anonymous"} - {Math.round((result.score / result.total_questions) * 100)}%
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-muted-foreground">No results available yet.</p>
                )}
              </CardContent>
              <CardFooter>
                <Link to={`/cbt`}>
                  <Button variant="secondary" className="w-full">
                    View Full Leaderboard
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="secondary" onClick={onReviewAnswers}>
            Review Answers
          </Button>
          <div>
            {savingError && (
              <p className="text-red-500 text-sm mb-2">{savingError}</p>
            )}
            {testDetails?.allow_retakes ? (
              <Button variant="outline" onClick={onTryAgain} className="mr-2">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            ) : null}
            <Button onClick={onFinish}>Finish</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TestResults;
