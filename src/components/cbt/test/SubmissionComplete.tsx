
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SubmissionCompleteProps {
  testDetails: any;
  testTakerInfo: any;
}

const SubmissionComplete: React.FC<SubmissionCompleteProps> = ({ testDetails, testTakerInfo }) => {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Test Submitted Successfully!</CardTitle>
        </div>
        <CardDescription>
          {testDetails?.title || "Quiz"}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6 text-center">
        <MailCheck className="mx-auto h-16 w-16 text-veno-primary mb-6" />
        <h2 className="text-2xl font-bold mb-2">Thank you for completing the test</h2>
        <p className="text-muted-foreground mb-6">
          Your answers have been recorded. The test creator will review your results
          {testTakerInfo?.email && " and may contact you via email with your score and feedback."}
        </p>
        <Button onClick={() => navigate('/cbt')} className="mt-4">
          Return to Tests
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubmissionComplete;
