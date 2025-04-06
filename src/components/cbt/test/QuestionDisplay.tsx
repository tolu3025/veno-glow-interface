
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface QuestionDisplayProps {
  currentQuestion: number;
  questions: any[];
  timeRemaining: number;
  selectedAnswer: number | null;
  onAnswerSelect: (index: number) => void;
  onPreviousQuestion: () => void;
  onNextQuestion: () => void;
  formatTime: (seconds: number) => string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  currentQuestion,
  questions,
  timeRemaining,
  selectedAnswer,
  onAnswerSelect,
  onPreviousQuestion,
  onNextQuestion,
  formatTime,
}) => {
  const totalQuestions = questions.length;
  const currentQuestionData = questions[currentQuestion];
  const questionText = currentQuestionData?.text || currentQuestionData?.question || 'Question not available';
  const options = currentQuestionData?.options || [];
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const handleOptionSelect = (index: number) => {
    onAnswerSelect(index);
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <Badge variant="outline" className="mb-2">
                Question {currentQuestion + 1} of {totalQuestions}
              </Badge>
              <CardTitle className="text-lg">
                Test in Progress
              </CardTitle>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              <CardDescription className="text-lg font-medium">
                {formatTime(timeRemaining)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-5">{questionText}</h3>
            
            <RadioGroup 
              value={selectedAnswer !== null ? selectedAnswer.toString() : undefined}
              className="space-y-3"
            >
              {options.map((option: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 border border-input p-3 rounded-md hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`} 
                    onClick={() => handleOptionSelect(index)}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer font-normal text-base"
                  >
                    <span className="font-medium mr-2">{alphabet[index]}.</span>
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <Button
            variant="outline"
            onClick={onPreviousQuestion}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={onNextQuestion}
            className="bg-veno-primary hover:bg-veno-primary/90"
          >
            {isLastQuestion ? 'Finish' : 'Next'}
            {!isLastQuestion && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuestionDisplay;
