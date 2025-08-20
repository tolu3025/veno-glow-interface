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

  // Enhanced detection of mathematical content
  const isMathematicalContent = (text: string): boolean => {
    const mathKeywords = [
      'calculate', 'formula', 'equation', 'step', 'solve', 'derivation',
      'proof', 'theorem', 'integral', 'derivative', 'function', 'variable',
      'coefficient', 'polynomial', 'matrix', 'vector', 'graph', 'plot',
      'minimum', 'maximum', 'limit', 'sum', 'product', 'substitut', 'factor',
      'simplify', 'expand', 'multiply', 'divide', 'add', 'subtract', 'equals',
      'expression', 'term', 'constant', 'unknown', 'solution', 'working'
    ];
    
    return mathKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    ) || /\$.*\$/.test(text) || /\\[a-zA-Z]+/.test(text) || 
       /[\d+\-*/=()^]/.test(text) || /step\s+\d+/i.test(text);
  };

  // Enhanced LaTeX rendering with better error handling
  const renderLatexContent = (text: string): string => {
    if (!text) return '';
    
    try {
      let processedText = text;
      
      // Handle display math ($$...$$) first
      processedText = processedText.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
        try {
          const cleanFormula = formula.trim();
          if (!cleanFormula) return match;
          return `<div class="katex-display">${renderToString(cleanFormula, { 
            displayMode: true,
            throwOnError: false 
          })}</div>`;
        } catch (error) {
          console.warn('LaTeX display math error:', error);
          return match;
        }
      });

      // Handle inline math ($...$)
      processedText = processedText.replace(/\$([^$]+)\$/g, (match, formula) => {
        try {
          const cleanFormula = formula.trim();
          if (!cleanFormula) return match;
          return renderToString(cleanFormula, { 
            displayMode: false,
            throwOnError: false 
          });
        } catch (error) {
          console.warn('LaTeX inline math error:', error);
          return match;
        }
      });

      return processedText;
    } catch (error) {
      console.warn('LaTeX processing error:', error);
      return text;
    }
  };

  // Simplify explanations for layman understanding
  const simplifyExplanation = (text: string): string => {
    // Replace technical terms with simpler ones
    const simplifications: { [key: string]: string } = {
      'coefficient': 'number in front of',
      'polynomial': 'expression with multiple terms',
      'derivative': 'rate of change',
      'integral': 'area under curve',
      'function': 'mathematical rule',
      'variable': 'unknown value',
      'theorem': 'mathematical rule',
      'proof': 'step-by-step verification',
      'substitution': 'replacing with',
      'factorization': 'breaking down into parts',
      'equation': 'mathematical statement',
      'expression': 'mathematical phrase'
    };

    let simplified = text;
    Object.entries(simplifications).forEach(([technical, simple]) => {
      const regex = new RegExp(`\\b${technical}\\b`, 'gi');
      simplified = simplified.replace(regex, `${technical} (${simple})`);
    });

    return simplified;
  };

  // Enhanced mathematical explanation formatting with calculation steps
  const formatMathematicalExplanation = (explanation: string): JSX.Element[] => {
    const simplifiedExplanation = simplifyExplanation(explanation);
    const paragraphs = simplifiedExplanation.split('\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      
      // Detect step headers (Step 1:, Step 2:, etc.)
      if (/^Step\s+\d+:/i.test(trimmed)) {
        return (
          <div key={index} className="mb-4">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-l-4 border-primary rounded-r-lg p-3">
              <h4 className="font-bold text-primary text-base mb-1">
                <span dangerouslySetInnerHTML={{ __html: renderLatexContent(trimmed) }} />
              </h4>
            </div>
          </div>
        );
      }

      // Detect calculation sections and formulas
      if (/^(calculation|solution|working|formula|equation):/i.test(trimmed) || /\$.*\$/.test(trimmed)) {
        return (
          <div key={index} className="mb-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="font-mono text-sm bg-white dark:bg-slate-900 p-3 rounded border">
                <span dangerouslySetInnerHTML={{ __html: renderLatexContent(trimmed) }} />
              </div>
            </div>
          </div>
        );
      }

      // Detect conclusion/answer statements
      if (/^(therefore|thus|hence|so|the answer is|final answer|result)/i.test(trimmed)) {
        return (
          <div key={index} className="mb-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-500 dark:border-green-400">
              <div className="font-semibold text-green-800 dark:text-green-200 flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                <span dangerouslySetInnerHTML={{ __html: renderLatexContent(trimmed) }} />
              </div>
            </div>
          </div>
        );
      }

      // Detect numerical calculations and expressions
      if (/[\d+\-*/=()]/.test(trimmed) && trimmed.length < 100) {
        return (
          <div key={index} className="mb-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 font-mono text-center border border-blue-200 dark:border-blue-800">
              <span dangerouslySetInnerHTML={{ __html: renderLatexContent(trimmed) }} />
            </div>
          </div>
        );
      }

      // Regular explanation text with better readability
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
    const simplifiedExplanation = simplifyExplanation(explanation);
    const paragraphs = simplifiedExplanation.split('\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => (
      <div key={index} className="mb-3">
        <p className="text-foreground leading-relaxed text-sm">
          <span dangerouslySetInnerHTML={{ __html: renderLatexContent(paragraph.trim()) }} />
        </p>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <style dangerouslySetInnerHTML={{
        __html: `
          .katex-display {
            margin: 1em 0;
            text-align: center;
          }
          .katex {
            font-size: 1.1em;
          }
          .katex .base {
            line-height: 1.2;
          }
        `
      }} />
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
        const correctAnswer = question.correctOption;
        const isCorrect = userAnswer?.selectedOption === correctAnswer;
        const isMathematical = isMathematicalContent(question.explanation);

        return (
          <Card key={question.id} className={`${isCorrect ? 'border-green-500/30 bg-green-50/50 dark:border-green-400/40 dark:bg-green-900/30' : 'border-red-500/30 bg-red-50/50 dark:border-red-400/40 dark:bg-red-900/30'}`}>
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
                          ? 'border-green-500/30 bg-green-50/50 dark:border-green-400/30 dark:bg-green-900/20'
                          : isSelected
                          ? 'border-red-500/30 bg-red-50/50 dark:border-red-400/30 dark:bg-red-900/20'
                          : 'border-border bg-muted/30'
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