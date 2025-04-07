
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
    <div className="bg-black min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="text-white text-2xl font-bold">Veno</div>
        <div className="flex items-center gap-4">
          <div className="text-white">
            <Clock className="h-6 w-6" />
          </div>
          <div className="text-white text-xl flex gap-2">
            <span className="sr-only">Time remaining:</span>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </header>
      
      <main className="flex-1 px-4 py-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-green-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15.88 8.29L10 14.17L8.12 12.29C7.73 11.9 7.1 11.9 6.71 12.29C6.32 12.68 6.32 13.31 6.71 13.7L9.3 16.29C9.69 16.68 10.32 16.68 10.71 16.29L17.3 9.7C17.69 9.31 17.69 8.68 17.3 8.29C16.91 7.9 16.27 7.9 15.88 8.29Z" fill="#4ADE80"/>
              </svg>
            </div>
            <div className="text-white text-xl font-bold">
              Question {currentQuestion + 1}/{totalQuestions}
            </div>
          </div>
          
          <div className="mb-6">
            <Progress value={progressPercentage} className="h-2 bg-gray-700">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${progressPercentage}%` }} />
            </Progress>
          </div>
          
          <div className="text-white text-2xl font-bold mb-4">
            {questionText}
          </div>
          
          {explanation && (
            <div className="text-gray-400 text-sm italic mb-6">
              (This question includes an explanation that will be available after completion)
            </div>
          )}
          
          <div className="space-y-4 mt-8">
            {options.map((option: string, index: number) => (
              <div
                key={index}
                className={`border rounded-lg p-4 flex items-center gap-4 cursor-pointer transition-all
                  ${selectedAnswer === index 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-gray-700 hover:border-gray-500'}`}
                onClick={() => handleOptionSelect(index)}
              >
                <div 
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium
                    ${selectedAnswer === index ? 'bg-green-500 text-black' : 'bg-transparent border border-white/70 text-white'}`}
                >
                  {alphabet[index]}
                </div>
                <span className="text-white text-lg">{option}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <footer className="p-4 mt-auto">
        <div className="max-w-xl mx-auto flex justify-between">
          <button
            className="bg-black border border-gray-700 rounded-lg px-8 py-3 text-white flex items-center gap-2 hover:bg-gray-900"
            onClick={onPreviousQuestion}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>
          
          <button
            className="bg-green-500 hover:bg-green-600 rounded-lg px-10 py-3 text-black font-medium"
            onClick={onNextQuestion}
          >
            {isLastQuestion ? 'Finish' : 'Next'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default QuestionDisplay;
