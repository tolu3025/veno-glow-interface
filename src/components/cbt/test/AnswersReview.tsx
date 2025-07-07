
import React from 'react';
import DetailedExplanationView from './DetailedExplanationView';

interface AnswersReviewProps {
  questions: any[];
  userAnswers: any[];
  score: number;
  timeRemaining: number;
  testDetails: any;
  location: any;
  onBackToSummary: () => void;
  onFinish: () => void;
  formatTime: (seconds: number) => string;
}

const AnswersReview: React.FC<AnswersReviewProps> = ({
  questions,
  userAnswers,
  score,
  testDetails,
  location,
  onBackToSummary,
}) => {
  const subject = testDetails?.title || testDetails?.subject || location?.state?.subject || "Test";

  return (
    <DetailedExplanationView
      questions={questions}
      userAnswers={userAnswers}
      score={score}
      subject={subject}
      onBack={onBackToSummary}
    />
  );
};

export default AnswersReview;
