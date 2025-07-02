
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { useQuizExplanations } from '@/hooks/useQuizExplanations';
import { cn } from '@/lib/utils';

const QuizExplanations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { questions, userAnswers, score, testDetails } = location.state || {};

  const { explanations, getQuestionExplanation } = useQuizExplanations(questions || [], userAnswers || []);

  if (!questions || !userAnswers) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-4">No Quiz Data Found</h2>
            <p className="text-center text-muted-foreground mb-6">
              Please complete a quiz first to view explanations
            </p>
            <Button onClick={() => navigate('/cbt')}>
              Back to CBT
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-veno-primary" />
                Quiz Explanations
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {testDetails?.title || 'Quiz'} - Review answers and explanations
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Final Score</p>
              <p className="text-2xl font-bold text-veno-primary">
                {score}/{questions.length}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {questions.map((question: any, index: number) => {
              const explanation = getQuestionExplanation(index);
              if (!explanation) return null;

              const { questionText, questionOptions, correctAnswer, explanation: explanationText, userAnswer } = explanation;

              return (
                <div key={question.id || index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                      userAnswer?.isCorrect 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {userAnswer?.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-3">
                        {index + 1}. {questionText}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 ml-11">
                    {questionOptions.map((option: string, optionIndex: number) => (
                      <div
                        key={optionIndex}
                        className={cn(
                          "flex items-center gap-3 py-2 px-3 rounded border",
                          optionIndex === correctAnswer
                            ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                            : optionIndex === userAnswer?.selectedOption && !userAnswer?.isCorrect
                            ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                            : "border-gray-200 dark:border-gray-600"
                        )}
                      >
                        <span className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium",
                          optionIndex === correctAnswer
                            ? "bg-green-500 text-white"
                            : optionIndex === userAnswer?.selectedOption && !userAnswer?.isCorrect
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        )}>
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {optionIndex === correctAnswer && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {optionIndex === userAnswer?.selectedOption && !userAnswer?.isCorrect && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Explanation Section */}
                  <div className="ml-11 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Explanation
                    </h4>
                    <div className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                      {explanationText ? (
                        <p>{explanationText}</p>
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
              );
            })}
          </div>

          <div className="mt-8 flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => navigate('/cbt')}
              className="bg-veno-primary hover:bg-veno-primary/90"
            >
              Back to CBT
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizExplanations;
