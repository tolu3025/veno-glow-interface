
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const NoQuestionsState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>No Questions Available</CardTitle>
        </div>
        <CardDescription>
          We couldn't find any questions for this test.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <p className="mb-4">There are currently no questions available for this subject or test.</p>
        <Button onClick={() => navigate('/cbt')}>
          Back to Tests
        </Button>
      </CardContent>
    </Card>
  );
};

export default NoQuestionsState;
