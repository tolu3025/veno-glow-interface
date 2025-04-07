
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck, Award, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SubmissionCompleteProps {
  testDetails: any;
  testTakerInfo: any;
}

const SubmissionComplete: React.FC<SubmissionCompleteProps> = ({ testDetails, testTakerInfo }) => {
  const navigate = useNavigate();
  
  const isCreatorOnly = testDetails?.results_visibility === 'creator_only';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle className="text-lg sm:text-xl">Test Submitted Successfully!</CardTitle>
        </div>
        <CardDescription>
          {testDetails?.title || "Quiz"}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6 text-center">
        {isCreatorOnly ? (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-veno-primary/20 rounded-full mb-6">
              <Check className="h-10 w-10 text-veno-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Thank you for completing the test</h2>
            <p className="text-muted-foreground mb-6">
              Your answers have been recorded. The test creator will review your results 
              and only they can see your score.
              {testTakerInfo?.email && " You may be contacted via email with your score and feedback."}
            </p>
          </>
        ) : (
          <>
            <Award className="mx-auto h-16 w-16 text-veno-primary mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Thank you for completing the test</h2>
            <p className="text-muted-foreground mb-6">
              Your answers have been recorded. The test creator will review your results.
              {testTakerInfo?.email && " You may be contacted via email with your score and feedback."}
            </p>
          </>
        )}
        <Button onClick={() => navigate('/cbt')} className="mt-4">
          Return to Tests
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubmissionComplete;
