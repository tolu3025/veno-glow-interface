
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AttemptBlockedStateProps {
  testDetails: any;
}

const AttemptBlockedState: React.FC<AttemptBlockedStateProps> = ({ testDetails }) => {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Test Already Taken</CardTitle>
        </div>
        <CardDescription>
          {testDetails?.title || ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <p className="mb-4">
          You have already taken this test and multiple attempts are not allowed.
        </p>
        <Button onClick={() => navigate('/cbt')}>
          Back to Tests
        </Button>
      </CardContent>
    </Card>
  );
};

export default AttemptBlockedState;
