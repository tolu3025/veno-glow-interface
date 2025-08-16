
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DetailedExplanationView from '@/components/cbt/test/DetailedExplanationView';
import 'katex/dist/katex.min.css';

const QuizExplanations: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from navigation state
  const { questions, userAnswers, score, subject, returnTo } = location.state || {};

  if (!questions || !userAnswers) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-4">No Quiz Data Found</h2>
            <p className="text-center text-muted-foreground mb-6">
              Please complete a quiz first to view explanations
            </p>
            <Button onClick={() => navigate('/cbt')}>Back to CBT</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleBackToResults = () => {
    if (returnTo === 'results') {
      // Navigate back to results with the same data
      navigate('/cbt/take/subject', {
        state: {
          showResults: true,
          questions,
          userAnswers,
          score,
          subject,
        },
        replace: true
      });
    } else {
      navigate(-1); // Fallback to previous page
    }
  };

  return (
    <DetailedExplanationView
      questions={questions}
      userAnswers={userAnswers}
      score={score}
      subject={subject || "Quiz"}
      onBack={handleBackToResults}
    />
  );
};

export default QuizExplanations;
