
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
  timeRemaining,
  testDetails,
  location,
  onBackToSummary,
  onFinish,
  formatTime,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const reviewRef = useRef<HTMLDivElement>(null);
  
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = userAnswers[currentIndex];
  
  const goToPreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      
      if (reviewRef.current) {
        reviewRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  const goToNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      
      if (reviewRef.current) {
        reviewRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  if (!currentQuestion) {
    return <div>No questions to review.</div>;
  }
  
  return (
    <div className="container mx-auto max-w-4xl my-8 px-4">
      <div ref={reviewRef}>
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VenoLogo className="h-6 w-6" />
                <CardTitle>Review Your Answers</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onBackToSummary}
              >
                Back to Summary
              </Button>
            </div>
            <CardDescription>
              {testDetails?.title || location?.state?.subject || "Quiz"} - Question {currentIndex + 1} of {questions.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="mb-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">
                  {currentQuestion.text || currentQuestion.question}
                </h3>
                
                <div className="space-y-3">
                  {currentQuestion.options && currentQuestion.options.map((option: string, index: number) => {
                    let optionClass = "border border-input rounded-md p-3 flex items-center gap-3";
                    let icon = null;
                    
                    const correctAnswerIndex = 
                      typeof currentQuestion.correctOption !== 'undefined' ? 
                      currentQuestion.correctOption : (
                        typeof currentQuestion.answer !== 'undefined' ? 
                        currentQuestion.answer : (
                          typeof currentQuestion.correct_answer !== 'undefined' ? 
                          currentQuestion.correct_answer : null
                        )
                      );
                    
                    if (correctAnswerIndex === index) {
                      optionClass += " bg-green-50 border-green-200";
                      icon = <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
                    } else if (currentAnswer && currentAnswer.selectedOption === index) {
                      optionClass += " bg-red-50 border-red-200";
                      icon = <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
                    }
                    
                    return (
                      <div key={index} className={optionClass}>
                        {icon && <div>{icon}</div>}
                        <div className="flex-1">{option}</div>
                      </div>
                    );
                  })}
                </div>
                
                {currentQuestion.explanation && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Explanation:</h4>
                    <p className="text-sm">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={currentIndex === 0}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={goToNextQuestion}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          <CardFooter className="pt-6 pb-6 flex-col">
            <div className="w-full mb-4 flex justify-center">
              <div className="text-sm text-muted-foreground">
                {currentIndex + 1} of {questions.length} Questions | Score: {score}/{questions.length} ({percentage}%)
              </div>
            </div>
            <div className="w-full">
              <Button 
                className="w-full bg-veno-primary hover:bg-veno-primary/90" 
                onClick={onFinish}
              >
                <Home className="h-4 w-4 mr-2" />
                Finish Review
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AnswersReview;
