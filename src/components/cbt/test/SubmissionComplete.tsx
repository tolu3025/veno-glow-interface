
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { soundSystem } from '@/utils/sound';

interface SubmissionCompleteProps {
  testDetails: any;
  testTakerInfo: any;
}

const SubmissionComplete: React.FC<SubmissionCompleteProps> = ({ testDetails, testTakerInfo }) => {
  const navigate = useNavigate();

  // Play completion sound when component mounts
  useEffect(() => {
    soundSystem.play('complete');
  }, []);

  const getCompletionMessage = () => {
    if (testDetails?.results_visibility === 'creator_only') {
      return {
        title: "Test Submitted Successfully!",
        icon: <Clock className="mx-auto h-16 w-16 text-veno-primary mb-6" />,
        heading: "Thank you for completing the test",
        message: testTakerInfo?.email 
          ? "Your answers have been recorded. The test creator will review your results and contact you via email with your score and feedback."
          : "Your answers have been recorded. The test creator will review your results and share them soon.",
      };
    }

    return {
      title: "Results Will Be Available Soon",
      icon: <MailCheck className="mx-auto h-16 w-16 text-veno-primary mb-6" />,
      heading: "Test Completed Successfully",
      message: "Your answers have been recorded. You can view your results on this platform once the test period is complete.",
    };
  };

  const content = getCompletionMessage();

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>{content.title}</CardTitle>
        </div>
        <CardDescription>
          {testDetails?.title || "Quiz"}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6 text-center">
        {content.icon}
        <h2 className="text-2xl font-bold mb-2">{content.heading}</h2>
        <p className="text-muted-foreground mb-6">
          {content.message}
        </p>
        <Button onClick={() => navigate('/cbt')} className="mt-4">
          Return to Tests
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubmissionComplete;
