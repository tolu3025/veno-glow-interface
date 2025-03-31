
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
            
            return (
              <Collapsible key={question.id} className="w-full">
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
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full", 
                        answer.isCorrect 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {answer.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-base">{index + 1}. {question.text}</div>
                        
                        <div className="mt-2 space-y-2 text-sm">
                          {question.options.map((option: string, optionIndex: number) => (
                            <div 
                              key={optionIndex}
                              className={cn(
                                "flex items-center gap-2 py-1 px-3 rounded",
                                optionIndex === question.correctOption 
                                  ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                                  : optionIndex === answer.selectedOption && !answer.isCorrect 
                                    ? "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400"
                                    : "text-gray-600 dark:text-gray-400"
                              )}
                            >
                              <div className={cn(
                                "flex items-center justify-center w-5 h-5 rounded-full text-xs border",
                                optionIndex === question.correctOption 
                                  ? "border-green-500 bg-green-500 text-white" 
                                  : optionIndex === answer.selectedOption && !answer.isCorrect
                                    ? "border-red-500 bg-red-500 text-white"
                                    : "border-gray-300 dark:border-gray-600"
                              )}>
                                {String.fromCharCode(65 + optionIndex)}
                              </div>
                              <span>{option}</span>
                              {optionIndex === question.correctOption && 
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
                    
                    <CollapsibleTrigger className="p-2 hover:bg-secondary/80 rounded-full transition-colors">
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent className="mt-3 pt-3 border-t space-y-2">
                    <div className="flex items-start gap-2 px-2 text-sm">
                      <Info size={16} className="text-veno-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Detailed Explanation</h4>
                        {/* Display the explanation properly from the question data */}
                        <p className="text-muted-foreground">
                          {question.explanation ? question.explanation : 
                            `The correct answer is ${String.fromCharCode(65 + question.correctOption)}: ${
                              question.options[question.correctOption]
                            }.`}
                        </p>
                      </div>
                    </div>
                    
                    {answer.isCorrect ? (
                      <div className="flex items-start gap-2 px-2 bg-green-50/50 dark:bg-green-950/10 p-2 rounded text-sm">
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-green-700 dark:text-green-400">Correct!</h4>
                          <p className="text-green-700/70 dark:text-green-500/70">
                            Great job on selecting the right option.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 px-2 bg-red-50/50 dark:bg-red-950/10 p-2 rounded text-sm">
                        <XCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-red-700 dark:text-red-400">Incorrect</h4>
                          <p className="text-red-700/70 dark:text-red-500/70">
                            You selected {answer.selectedOption !== null ? 
                              `option ${String.fromCharCode(65 + answer.selectedOption)}` : 
                              "no answer"}.
                            The correct answer is option {String.fromCharCode(65 + question.correctOption)}.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Enhanced explanation section that always shows */}
                    {question.explanation && (
                      <div className="flex items-start gap-2 px-2 bg-blue-50/50 dark:bg-blue-950/10 p-3 mt-2 rounded-md border border-blue-200 dark:border-blue-800/40">
                        <BookOpen size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-blue-700 dark:text-blue-400">Learning Point</h4>
                          <div className="text-blue-700/70 dark:text-blue-400/70 prose-sm prose-p:mt-1 prose prose-headings:text-blue-700">
                            <p>{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}
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
