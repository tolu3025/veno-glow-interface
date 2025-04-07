
import React from 'react';
import { Clock, ChevronLeft } from 'lucide-react';
import { VenoLogo } from '@/components/ui/logo';
import { Progress } from '@/components/ui/progress';

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
  const explanation = currentQuestionData?.explanation;
  const alphabet = 'ABCD';

  const handleOptionSelect = (index: number) => {
    onAnswerSelect(index);
  };

  // Calculate progress percentage
  const progressPercentage = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="container max-w-2xl mx-auto py-4 px-4 min-h-screen flex flex-col">
      <div className="bg-black/90 text-white rounded-lg p-6 flex-1 flex flex-col">
        {/* Header with logo */}
        <div className="flex justify-between items-center mb-8">
          <VenoLogo className="h-6 w-6" />
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-medium">{formatTime(timeRemaining)}</span>
          </div>
        </div>
        
        {/* Question header with question number and progress */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-veno-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.95 9.1L11.53 14.92C11.38 15.08 11.19 15.15 11 15.15C10.81 15.15 10.62 15.08 10.47 14.92L7.05 11.28C6.75 10.96 6.75 10.44 7.05 10.12C7.35 9.8 7.85 9.8 8.15 10.12L11 13.15L15.85 7.98C16.15 7.66 16.65 7.68 16.95 8C17.25 8.32 17.25 8.78 16.95 9.1Z" fill="#4ADE80"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Question {currentQuestion + 1}/{totalQuestions}</h2>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-gray-700">
            <div className="h-full bg-veno-primary rounded-full" style={{ width: `${progressPercentage}%` }} />
          </Progress>
        </div>
        
        {/* Question text */}
        <div className="mb-8">
          <h3 className="text-xl sm:text-2xl font-semibold mb-2">{questionText}</h3>
          {explanation && (
            <p className="text-gray-400 text-sm italic">
              (This question includes an explanation that will be available after completion)
            </p>
          )}
        </div>
        
        {/* Answer options */}
        <div className="space-y-4 flex-1">
          {options.map((option: string, index: number) => (
            <div
              key={index}
              className={`border rounded-lg p-4 flex items-start gap-4 cursor-pointer transition-all
                ${selectedAnswer === index 
                  ? 'border-veno-primary bg-veno-primary/10 text-white' 
                  : 'border-gray-700 hover:border-gray-500 text-white/90'}`}
              onClick={() => handleOptionSelect(index)}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${selectedAnswer === index ? 'bg-veno-primary text-black' : 'bg-gray-800 text-white'}`}>
                {alphabet[index]}
              </div>
              <span className="text-lg">{option}</span>
            </div>
          ))}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 text-white disabled:opacity-50"
            onClick={onPreviousQuestion}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            className="px-8 py-3 rounded-lg bg-veno-primary hover:bg-veno-primary/90 text-black font-medium"
            onClick={onNextQuestion}
          >
            {isLastQuestion ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;
