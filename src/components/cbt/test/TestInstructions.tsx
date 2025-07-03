import React from 'react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { GuestTestTakerInfo } from '@/components/cbt/GuestTestTakerForm';
interface TestInstructionsProps {
  testDetails: any;
  questions: any[];
  location: any;
  previousAttempts: number;
  onStartTest: () => void;
  onShowTakerForm: () => void;
  user: any;
  testId: string;
  testTakerInfo?: GuestTestTakerInfo | null;
}
const TestInstructions: React.FC<TestInstructionsProps> = ({
  testDetails,
  questions,
  location,
  previousAttempts,
  onStartTest,
  user,
  testId,
  testTakerInfo
}) => {
  const isPublicTest = location.pathname.startsWith('/test/');
  return <Card>
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
          {user ? <div className="p-4 rounded-lg bg-blue-700">
              <h3 className="font-medium mb-2 text-gray-950">Test Taker Information</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-950">Email:</span>
                  <span className="font-medium text-gray-950">{user.email}</span>
                </div>
              </div>
            </div> : testTakerInfo ? <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium mb-3 text-blue-800">Test Taker Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600">Name:</span>
                  <span className="font-medium text-blue-800">{testTakerInfo.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Email:</span>
                  <span className="font-medium text-blue-800">{testTakerInfo.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Department:</span>
                  <span className="font-medium text-blue-800">{testTakerInfo.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Level:</span>
                  <span className="font-medium text-blue-800">{testTakerInfo.level}</span>
                </div>
              </div>
            </div> : <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Taking Test as Guest</h3>
              <p className="text-sm text-muted-foreground">
                You're taking this test as a guest. Your results will be saved with the information you provide during the test submission.
              </p>
            </div>}
          
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
              {location?.state?.settings && <li className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className="font-medium capitalize">
                    {location.state.settings.difficulty === 'all' ? 'All Levels' : location.state.settings.difficulty}
                  </span>
                </li>}
              {testDetails && <>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Multiple Attempts:</span>
                    <span className="font-medium">{testDetails.allow_retakes ? 'Allowed' : 'Not allowed'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Results Visibility:</span>
                    <span className="font-medium">
                      {testDetails.results_visibility === 'creator_only' ? 'Only visible to test creator' : testDetails.results_visibility === 'test_takers' ? 'Visible to you after completion' : 'Publicly visible'}
                    </span>
                  </li>
                </>}
            </ul>
          </div>
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Instructions</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read each question carefully</li>
              <li>Select the best answer from the options</li>
              <li>You can go back to previous questions</li>
              <li>The test will automatically submit when time runs out</li>
              {testDetails?.results_visibility === 'creator_only' && <li>Your results will be available to the test creator only</li>}
              {isPublicTest && <li>This is a shared test - your results may be visible based on the test settings</li>}
              {!user && <li>You'll be asked for your name and email during the test submission</li>}
              {user && testDetails && !testDetails.allow_retakes && previousAttempts > 0 && <li className="text-orange-600 font-medium">Note: You have already taken this test. Multiple attempts are not allowed.</li>}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onStartTest}>
          Start Quiz
        </Button>
      </CardFooter>
    </Card>;
};
export default TestInstructions;