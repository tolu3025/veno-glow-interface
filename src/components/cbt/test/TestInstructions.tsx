
import React from 'react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTakerInfo } from '@/components/cbt/TestTakerForm';

interface TestInstructionsProps {
  testDetails: any;
  questions: any[];
  location: any;
  previousAttempts: number;
  onStartTest: () => void;
  onShowTakerForm: () => void;
  user: any;
  testId: string;
  testTakerInfo?: TestTakerInfo | null;
}

const TestInstructions: React.FC<TestInstructionsProps> = ({
  testDetails,
  questions,
  location,
  previousAttempts,
  onStartTest,
  onShowTakerForm,
  user,
  testId,
  testTakerInfo,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Ready to Start?</CardTitle>
        </div>
        <CardDescription>
          {testDetails?.title || location?.state?.subject || testId} Quiz
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6">
        <div className="space-y-4">
          {testTakerInfo && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Test Taker Information</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{testTakerInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{testTakerInfo.email}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Quiz Information</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-medium">
                  {testDetails?.title || location?.state?.subject || "General"}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Questions:</span>
                <span className="font-medium">{questions.length}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Time Limit:</span>
                <span className="font-medium">
                  {testDetails?.time_limit || location?.state?.settings?.timeLimit || 15} minutes
                </span>
              </li>
              {location?.state?.settings && (
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className="font-medium capitalize">
                    {location.state.settings.difficulty === 'all' ? 'All Levels' : location.state.settings.difficulty}
                  </span>
                </li>
              )}
              {testDetails && (
                <>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Multiple Attempts:</span>
                    <span className="font-medium">{testDetails.allow_retakes ? 'Allowed' : 'Not allowed'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Results Visibility:</span>
                    <span className="font-medium">
                      {testDetails.results_visibility === 'creator_only' 
                        ? 'Only visible to test creator' 
                        : testDetails.results_visibility === 'test_takers' 
                          ? 'Visible to you after completion' 
                          : 'Publicly visible'}
                    </span>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Instructions</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read each question carefully</li>
              <li>Select the best answer from the options</li>
              <li>You can go back to previous questions</li>
              <li>The test will automatically submit when time runs out</li>
              {testDetails?.results_visibility === 'creator_only' && (
                <li>Your results will be available to the test creator only</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => {
          // For non-subject tests (formal tests), always require test taker info if not provided
          if (testId !== 'subject' && !testTakerInfo) {
            onShowTakerForm();
          } else {
            onStartTest();
          }
        }}>
          Start Quiz
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TestInstructions;
