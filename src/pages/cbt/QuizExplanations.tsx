import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { renderToString } from 'katex';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

interface UserAnswer {
  questionId: string;
  selectedOption: number;
}

const QuizExplanations: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { questions, userAnswers, score, subject, returnTo } = location.state || {};

  if (!questions || !userAnswers) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-4">No Quiz Data Found</h2>
            <p className="text-center text-muted-foreground mb-6">
              Please complete a quiz first to view explanations
            </p>
            <Button onClick={() => navigate('/cbt')}>Back to CBT</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleBackToResults = () => {
    if (returnTo === 'results') {
      navigate('/cbt/take/subject', {
        state: {
          showResults: true,
          questions,
          userAnswers,
          score,
          subject,
        },
        replace: true
      });
    } else {
      navigate(-1);
    }
  };

  // Detect if text contains mathematical content
  const isMathematicalContent = (text: string): boolean => {
    const mathKeywords = [
      'calculate', 'formula', 'equation', 'step', 'solve', 'derivation',
      'proof', 'theorem', 'integral', 'derivative', 'function', 'variable',
      'coefficient', 'polynomial', 'matrix', 'vector', 'graph', 'plot',
      'minimum', 'maximum', 'limit', 'sum', 'product'
    ];
    
    return mathKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    ) || /\$.*\$/.test(text) || /\\[a-zA-Z]+/.test(text);
  };

  // Enhanced LaTeX rendering
  const renderLatexContent = (text: string): string => {
    try {
      // Handle display math ($$...$$)
      text = text.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
        try {
          return `<div class="katex-display">${renderToString(formula.trim(), { displayMode: true })}</div>`;
        } catch {
          return match;
        }
      });

      // Handle inline math ($...$)
      text = text.replace(/\$([^$]+)\$/g, (match, formula) => {
        try {
          return renderToString(formula.trim(), { displayMode: false });
        } catch {
          return match;
        }
      });

      return text;
    } catch {
      return text;
    }
  };

  // Format step-by-step explanations for mathematical content
  const formatMathematicalExplanation = (explanation: string): JSX.Element[] => {
    const paragraphs = explanation.split('\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      
      // Detect step headers
      if (/^Step\s+\d+:/i.test(trimmed)) {
        return (
          <div key={index} className="mb-4">
            <h4 className="font-semibold text-primary mb-2 border-l-4 border-primary pl-3">
              <span dangerouslySetInnerHTML={{ __html: renderLatexContent(trimmed) }} />
            </h4>
          </div>
        );
      }

      // Detect calculation sections
      if (/^(calculation|solution|working):/i.test(trimmed)) {
        return (
          <div key={index} className="mb-4">
            <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-accent">
              <div className="font-medium text-accent-foreground mb-2">
                <span dangerouslySetInnerHTML={{ __html: renderLatexContent(trimmed) }} />
              </div>
            </div>
          </div>
        );
      }

      // Detect conclusion/answer statements
      if (/^(therefore|thus|hence|so|the answer is)/i.test(trimmed)) {
        return (
          <div key={index} className="mb-4">
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <div className="font-medium text-primary">
                <span dangerouslySetInnerHTML={{ __html: renderLatexContent(trimmed) }} />
              </div>
            </div>
          </div>
        );
      }

      // Regular explanation text
      return (
        <div key={index} className="mb-3">
          <p className="text-foreground leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: renderLatexContent(trimmed) }} />
          </p>
        </div>
      );
    });
  };

  // Format regular explanations (non-mathematical)
  const formatRegularExplanation = (explanation: string): JSX.Element[] => {
    const paragraphs = explanation.split('\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => (
      <div key={index} className="mb-3">
        <p className="text-foreground leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: renderLatexContent(paragraph.trim()) }} />
        </p>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBackToResults} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-semibold">{subject} - Detailed Explanations</h1>
              <Badge variant="secondary" className="mt-1">
                Score: {score}/{questions.length}
              </Badge>
            </div>
            <div className="w-24" /> {/* Spacer for center alignment */}
          </div>
        </div>
      </div>

      {/* Questions and Explanations */}
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {questions.map((question: Question, index: number) => {
          const userAnswer = userAnswers.find((ua: UserAnswer) => ua.questionId === question.id);
          const isCorrect = userAnswer?.selectedOption === question.correctOption;
          const isMathematical = isMathematicalContent(question.explanation);

          return (
            <Card key={question.id} className={`${isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Question {index + 1}
                      </span>
                      <Badge variant={isCorrect ? "default" : "destructive"} className="text-xs">
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                    <h3 className="text-base font-medium leading-relaxed">
                      <span dangerouslySetInnerHTML={{ __html: renderLatexContent(question.question) }} />
                    </h3>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Answer Options */}
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = userAnswer?.selectedOption === optionIndex;
                    const isCorrectOption = optionIndex === question.correctOption;
                    
                    return (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-lg border ${
                          isCorrectOption
                            ? 'border-green-300 bg-green-50'
                            : isSelected
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span className="flex-1">
                            <span dangerouslySetInnerHTML={{ __html: renderLatexContent(option) }} />
                          </span>
                          {isCorrectOption && (
                            <Badge variant="default" className="text-xs">Correct</Badge>
                          )}
                          {isSelected && !isCorrectOption && (
                            <Badge variant="destructive" className="text-xs">Your Answer</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    Detailed Explanation
                    {isMathematical && (
                      <Badge variant="outline" className="text-xs">Mathematical</Badge>
                    )}
                  </h4>
                  <div className="prose prose-sm max-w-none">
                    {isMathematical
                      ? formatMathematicalExplanation(question.explanation)
                      : formatRegularExplanation(question.explanation)
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuizExplanations;