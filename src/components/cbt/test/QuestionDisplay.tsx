
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Calculator, Flag } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AdPlacement from '@/components/ads/AdPlacement';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [showCalculator, setShowCalculator] = useState(false);
  const [flagged, setFlagged] = useState<boolean[]>(new Array(questions.length).fill(false));
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [prevNumber, setPrevNumber] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const currentQuestionData = questions[currentQuestion];
  
  const processOptions = () => {
    if (!currentQuestionData) return [];
    
    const options = currentQuestionData.options;
    
    if (Array.isArray(options)) {
      return options;
    } else if (typeof options === 'object' && options !== null) {
      return Object.values(options);
    } else if (typeof options === 'string') {
      try {
        const parsedOptions = JSON.parse(options);
        return Array.isArray(parsedOptions) ? parsedOptions : Object.values(parsedOptions);
      } catch (e) {
        console.error('Failed to parse options string:', e);
        return [options];
      }
    }
    
    return [];
  };
  
  const questionOptions = processOptions();
  
  const questionText = currentQuestionData?.text || currentQuestionData?.question || 'No question text available';

  const handleNumber = (num: string) => {
    if (newNumber) {
      setCalcDisplay(num);
      setNewNumber(false);
    } else {
      setCalcDisplay(calcDisplay === '0' ? num : calcDisplay + num);
    }
  };

  const handleOperation = (op: string) => {
    const current = parseFloat(calcDisplay);
    if (prevNumber === null) {
      setPrevNumber(current);
    } else if (operation) {
      const result = calculate(prevNumber, current, operation);
      setPrevNumber(result);
      setCalcDisplay(String(result));
    }
    setOperation(op);
    setNewNumber(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEqual = () => {
    if (prevNumber !== null && operation) {
      const current = parseFloat(calcDisplay);
      const result = calculate(prevNumber, current, operation);
      setCalcDisplay(String(result));
      setPrevNumber(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setCalcDisplay('0');
    setPrevNumber(null);
    setOperation(null);
    setNewNumber(true);
  };

  const toggleFlag = () => {
    const newFlagged = [...flagged];
    newFlagged[currentQuestion] = !newFlagged[currentQuestion];
    setFlagged(newFlagged);
  };

  return (
    <div className="space-y-2 xs:space-y-3 sm:space-y-4">
      <style dangerouslySetInnerHTML={{
        __html: `
          .katex-display {
            margin: 0.5em 0;
            text-align: center;
          }
          .katex {
            font-size: 0.9em;
          }
          @media (min-width: 480px) {
            .katex { font-size: 1em; }
          }
          @media (min-width: 640px) {
            .katex-display { margin: 1em 0; }
            .katex { font-size: 1.1em; }
          }
        `
      }} />
      <Card>
        <CardHeader className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 xs:py-3 sm:py-4">
          <div className="flex flex-col space-y-2 xs:space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 xs:gap-2">
              <VenoLogo className="h-5 w-5 xs:h-6 xs:w-6" />
              <CardTitle className="text-sm xs:text-base sm:text-lg">Question {currentQuestion + 1}/{questions.length}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-1.5 xs:gap-2 sm:gap-3">
              <div className="flex items-center gap-1 bg-secondary/30 px-2 xs:px-3 py-0.5 xs:py-1 rounded-full">
                <Clock className="h-3 w-3 xs:h-4 xs:w-4" />
                <span className="text-xs xs:text-sm font-medium">{formatTime(timeRemaining)}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(true)}
                className="flex items-center gap-1 sm:gap-2 px-1.5 xs:px-2 sm:px-3 h-7 xs:h-8 sm:h-9 text-xs xs:text-sm"
              >
                <Calculator className="h-3 w-3 xs:h-4 xs:w-4" />
                <span className="sm:inline hidden">Calculator</span>
              </Button>
              
              <Button
                variant={flagged[currentQuestion] ? "destructive" : "outline"}
                size="sm"
                onClick={toggleFlag}
                className="flex items-center gap-1 sm:gap-2 px-1.5 xs:px-2 sm:px-3 h-7 xs:h-8 sm:h-9 text-xs xs:text-sm"
              >
                <Flag className="h-3 w-3 xs:h-4 xs:w-4" />
                <span className="sm:inline hidden">{flagged[currentQuestion] ? 'Flagged' : 'Flag'}</span>
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <Progress 
              value={((currentQuestion + 1) / questions.length) * 100} 
              className="h-1 xs:h-1.5 sm:h-2"
            />
          </div>
        </CardHeader>
        <CardContent className="px-2 xs:px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
          <div className="space-y-3 xs:space-y-4 sm:space-y-6">
            <div>
              <div className="text-sm xs:text-base sm:text-lg font-medium mb-2 leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({ children }) => <span>{children}</span>,
                  }}
                >
                  {questionText}
                </ReactMarkdown>
              </div>
              {currentQuestionData?.explanation && (
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground italic mb-3 sm:mb-4">
                  (This question includes an explanation that will be available after completion)
                </p>
              )}
            </div>
            <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
              {questionOptions.length > 0 ? (
                questionOptions.map((option: string, index: number) => (
                  <div 
                    key={index}
                    className={`p-2 xs:p-2.5 sm:p-3 md:p-4 border rounded-md sm:rounded-lg cursor-pointer transition-all active:scale-[0.98] ${
                      selectedAnswer === index 
                        ? 'border-veno-primary bg-veno-primary/5 shadow-sm' 
                        : 'hover:border-veno-primary/50'
                    }`}
                    onClick={() => onAnswerSelect(index)}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 rounded-full border-2 text-[10px] xs:text-xs sm:text-sm font-semibold flex-shrink-0 transition-colors ${
                        selectedAnswer === index 
                          ? 'border-veno-primary bg-veno-primary text-white' 
                          : 'border-muted-foreground/50'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div className="flex-1 text-xs xs:text-sm sm:text-base leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({ children }) => <span>{children}</span>,
                          }}
                        >
                          {option}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-2 xs:p-3 sm:p-4 border rounded-lg text-center text-muted-foreground text-xs xs:text-sm">
                  No options available for this question.
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 xs:gap-3 sm:gap-4 pt-3 xs:pt-4 sm:pt-6 border-t mt-3 xs:mt-4 sm:mt-6 px-2 xs:px-3 sm:px-4 md:px-6">
          <Button 
            variant="outline" 
            onClick={onPreviousQuestion}
            disabled={currentQuestion === 0}
            className="flex-1 text-xs xs:text-sm h-8 xs:h-9 sm:h-10"
          >
            <ArrowLeft className="h-3 w-3 xs:h-4 xs:w-4 mr-1 xs:mr-2" />
            <span className="hidden xs:inline">Previous</span>
            <span className="xs:hidden">Prev</span>
          </Button>
          <Button 
            className="flex-1 bg-veno-primary hover:bg-veno-primary/90 text-xs xs:text-sm h-8 xs:h-9 sm:h-10" 
            onClick={onNextQuestion}
          >
            {currentQuestion < questions.length - 1 ? 'Next' : 'Finish'}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-[90vw] xs:max-w-xs sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm xs:text-base sm:text-lg">Calculator</DialogTitle>
          </DialogHeader>
          <div className="p-2 xs:p-3 sm:p-4">
            <div className="bg-secondary/10 p-2 xs:p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 text-right">
              <span className="text-lg xs:text-xl sm:text-2xl font-mono">{calcDisplay}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 xs:gap-1.5 sm:gap-2">
              {[7, 8, 9, '÷', 4, 5, 6, '×', 1, 2, 3, '-', 0, '.', '=', '+'].map((btn) => (
                <Button
                  key={btn}
                  variant={typeof btn === 'number' || btn === '.' ? "outline" : "default"}
                  onClick={() => {
                    if (typeof btn === 'number') handleNumber(String(btn));
                    else if (btn === '=') handleEqual();
                    else if (btn === '.') {
                      if (!calcDisplay.includes('.')) handleNumber('.');
                    }
                    else handleOperation(btn);
                  }}
                  className="h-9 xs:h-10 sm:h-12 text-sm xs:text-base sm:text-lg"
                >
                  {btn}
                </Button>
              ))}
              <Button
                variant="destructive"
                onClick={handleClear}
                className="h-9 xs:h-10 sm:h-12 col-span-4 mt-1 xs:mt-1.5 sm:mt-2 text-sm xs:text-base"
              >
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="my-2 xs:my-3 sm:my-4">
        <AdPlacement location="content" contentCheck={false} />
      </div>
    </div>
  );
};

export default QuestionDisplay;
