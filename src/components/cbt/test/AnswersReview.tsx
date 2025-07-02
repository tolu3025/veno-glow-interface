
import React from 'react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Trophy, CheckCircle, XCircle, ChevronDown, Info, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  const timeLimit = testDetails?.time_limit || location?.state?.settings?.timeLimit || 15;
  const timeTaken = timeLimit * 60 - timeRemaining;

  console.log('AnswersReview data:', {
    questions: questions.length,
    userAnswers: userAnswers.length,
    timeLimit,
    timeRemaining,
    timeTaken,
    sampleQuestion: questions[0],
    sampleAnswer: userAnswers[0]
  });

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Quiz Review</CardTitle>
        </div>
        <CardDescription>
          {testDetails?.title || location?.state?.subject || "Quiz"} - Review your answers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-veno-primary" />
              <h2 className="font-semibold">Final Score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)</h2>
            </div>
            <div className="text-sm text-muted-foreground">
              Time taken: {formatTime(timeTaken)}
            </div>
          </div>
          <Progress value={Math.round((score / questions.length) * 100)} className="h-2" />
        </div>
        
        <div className="space-y-6 mt-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-veno-primary" />
            <h3 className="text-lg font-semibold">Question Review & Explanations</h3>
          </div>
          
          {userAnswers.map((answer, index) => {
            const question = questions[index];
            if (!question) return null;
            
            // Normalize question data structure - handle multiple possible field names
            const questionText = question.text || question.question || question.question_text || '';
            const questionOptions = Array.isArray(question.options) ? question.options : [];
            const correctAnswer = question.correctOption !== undefined ? question.correctOption : 
                                question.answer !== undefined ? question.answer : 0;
            const questionExplanation = question.explanation || '';
            
            console.log(`Question ${index + 1}:`, {
              questionText,
              questionOptions,
              correctAnswer,
              questionExplanation,
              userSelectedOption: answer.selectedOption,
              isCorrect: answer.isCorrect
            });
            
            return (
              <Collapsible key={question.id || index} className="w-full">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "rounded-lg border p-4 transition-all hover:shadow-md", 
                    answer.isCorrect 
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
                      : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full", 
                        answer.isCorrect 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {answer.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-base mb-3">{index + 1}. {questionText}</div>
                        
                        <div className="space-y-2 text-sm">
                          {questionOptions.map((option: string, optionIndex: number) => (
                            <div 
                              key={optionIndex}
                              className={cn(
                                "flex items-center gap-2 py-2 px-3 rounded border",
                                optionIndex === correctAnswer 
                                  ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-300"
                                  : optionIndex === answer.selectedOption && !answer.isCorrect 
                                    ? "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-300"
                                    : "text-gray-600 dark:text-gray-400 border-gray-200"
                              )}
                            >
                              <div className={cn(
                                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border-2",
                                optionIndex === correctAnswer 
                                  ? "border-green-500 bg-green-500 text-white" 
                                  : optionIndex === answer.selectedOption && !answer.isCorrect
                                    ? "border-red-500 bg-red-500 text-white"
                                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                              )}>
                                {String.fromCharCode(65 + optionIndex)}
                              </div>
                              <span className="flex-1">{option}</span>
                              {optionIndex === correctAnswer && 
                                <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                              }
                              {optionIndex === answer.selectedOption && !answer.isCorrect && 
                                <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <CollapsibleTrigger className="p-2 hover:bg-secondary/80 rounded-full transition-colors ml-2">
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent className="mt-4">
                    <div className="space-y-3 pl-10">
                      {/* Answer Status */}
                      {answer.isCorrect ? (
                        <div className="flex items-start gap-2 bg-green-50/80 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                          <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-green-700 dark:text-green-400">Correct Answer!</h4>
                            <p className="text-green-700/80 dark:text-green-500/80 text-sm">
                              Great job! You selected the right option.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 bg-red-50/80 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                          <XCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-red-700 dark:text-red-400">Incorrect</h4>
                            <p className="text-red-700/80 dark:text-red-500/80 text-sm">
                              You selected {answer.selectedOption !== null && answer.selectedOption !== undefined ? 
                                `option ${String.fromCharCode(65 + answer.selectedOption)}` : 
                                "no answer"}. 
                              The correct answer is option {String.fromCharCode(65 + correctAnswer)}.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Explanation */}
                      <div className="flex items-start gap-2 bg-blue-50/80 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">Detailed Explanation</h4>
                          <div className="text-blue-700/80 dark:text-blue-400/80 text-sm leading-relaxed">
                            {questionExplanation ? (
                              <p>{questionExplanation}</p>
                            ) : (
                              <p>
                                The correct answer is <strong>{String.fromCharCode(65 + correctAnswer)}</strong>: {
                                  questionOptions[correctAnswer] || 'Not available'
                                }.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </motion.div>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="flex gap-4">
        <Button variant="outline" className="flex-1" onClick={onBackToSummary}>
          Back to Summary
        </Button>
        <Button className="flex-1 bg-veno-primary hover:bg-veno-primary/90" onClick={onFinish}>
          Finish Review
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AnswersReview;
