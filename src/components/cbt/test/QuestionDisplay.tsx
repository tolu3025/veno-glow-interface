
import React from 'react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AdPlacement from '@/components/ads/AdPlacement';

interface QuestionDisplayProps {
  currentQuestion: number;
  questions: any[];
  timeRemaining: number;
  selectedAnswer: number | null;
  onAnswerSelect: (optionIndex: number) => void;
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
  const currentQuestionData = questions[currentQuestion];
  
  // Enhanced debugging to help diagnose rendering issues
  console.log('Current question details:', {
    questionNumber: currentQuestion + 1,
    questionId: currentQuestionData?.id,
    question: currentQuestionData?.text || currentQuestionData?.question,
    options: currentQuestionData?.options,
    correctAnswer: currentQuestionData?.correctOption || currentQuestionData?.answer,
    selectedAnswer
  });
  
  // Improved option processing to handle more formats
  const processOptions = () => {
    if (!currentQuestionData) return [];
    
    const options = currentQuestionData.options;
    
    // Handle different option formats
    if (Array.isArray(options)) {
      return options;
    } else if (typeof options === 'object' && options !== null) {
      // Convert object to array if needed
      return Object.values(options);
    } else if (typeof options === 'string') {
      // Try to parse JSON string
      try {
        const parsedOptions = JSON.parse(options);
        return Array.isArray(parsedOptions) ? parsedOptions : Object.values(parsedOptions);
      } catch (e) {
        console.error('Failed to parse options string:', e);
        return [options]; // Return as single item array as fallback
      }
    }
    
    return [];
  };
  
  const questionOptions = processOptions();
  
  // Get question text from either text or question property
  const questionText = currentQuestionData?.text || currentQuestionData?.question || 'No question text available';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VenoLogo className="h-6 w-6" />
              <CardTitle>Question {currentQuestion + 1}/{questions.length}</CardTitle>
            </div>
            <div className="flex items-center gap-1 bg-secondary/30 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <div className="mt-2">
            <Progress 
              value={((currentQuestion + 1) / questions.length) * 100} 
              className="h-2"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">{questionText}</h3>
              {/* Display explanation hint if available */}
              {currentQuestionData?.explanation && (
                <p className="text-sm text-muted-foreground italic mb-4">
                  (This question includes an explanation that will be available after completion)
                </p>
              )}
            </div>
            <div className="space-y-3">
              {questionOptions.length > 0 ? (
                questionOptions.map((option: string, index: number) => (
                  <div 
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAnswer === index 
                        ? 'border-veno-primary bg-veno-primary/5' 
                        : 'hover:border-veno-primary/50'
                    }`}
                    onClick={() => onAnswerSelect(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${
                        selectedAnswer === index 
                          ? 'border-veno-primary bg-veno-primary text-white' 
                          : 'border-gray-300'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div>{option}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 border rounded-lg text-center text-muted-foreground">
                  No options available for this question.
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4 pt-6 border-t mt-6">
          <Button 
            variant="outline" 
            onClick={onPreviousQuestion}
            disabled={currentQuestion === 0}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button 
            className="flex-1 bg-veno-primary hover:bg-veno-primary/90" 
            onClick={onNextQuestion}
          >
            {currentQuestion < questions.length - 1 ? 'Next' : 'Finish'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Add advertisement below the question */}
      <div className="my-4">
        <AdPlacement location="content" contentCheck={false} />
      </div>
    </div>
  );
};

export default QuestionDisplay;
