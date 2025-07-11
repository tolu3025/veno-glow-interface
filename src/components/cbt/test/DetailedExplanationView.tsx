
import React from 'react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { ArrowLeft, CheckCircle, XCircle, Calculator, Lightbulb, BookOpen, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface DetailedExplanationViewProps {
  questions: any[];
  userAnswers: any[];
  score: number;
  subject: string;
  onBack: () => void;
}

const DetailedExplanationView: React.FC<DetailedExplanationViewProps> = ({
  questions,
  userAnswers,
  score,
  subject,
  onBack
}) => {
  const renderLatex = (expression: string) => {
    try {
      return katex.renderToString(expression, {
        displayMode: false,
        throwOnError: false,
        strict: false,
        trust: true,
        macros: {
          "\\arcsin": "\\operatorname{arcsin}",
          "\\arccos": "\\operatorname{arccos}",
          "\\arctan": "\\operatorname{arctan}",
          "\\int": "\\int",
          "\\frac": "\\frac"
        }
      });
    } catch (error) {
      console.error('KaTeX render error:', error);
      return expression;
    }
  };

  const renderDisplayLatex = (expression: string) => {
    try {
      return katex.renderToString(expression, {
        displayMode: true,
        throwOnError: false,
        strict: false,
        trust: true,
        macros: {
          "\\arcsin": "\\operatorname{arcsin}",
          "\\arccos": "\\operatorname{arccos}",
          "\\arctan": "\\operatorname{arctan}",
          "\\int": "\\int",
          "\\frac": "\\frac"
        }
      });
    } catch (error) {
      console.error('KaTeX display render error:', error);
      return expression;
    }
  };

  const processLatexContent = (text: string) => {
    if (!text) return text;

    // Process display math first ($$...$$, \[...\])
    let processedText = text
      .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        const rendered = renderDisplayLatex(math.trim());
        return `<div class="math-display my-4 text-center">${rendered}</div>`;
      })
      .replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        const rendered = renderDisplayLatex(math.trim());
        return `<div class="math-display my-4 text-center">${rendered}</div>`;
      });

    // Process inline math (\(...\), $...$)
    processedText = processedText
      .replace(/\\\((.*?)\\\)/g, (_, math) => {
        const rendered = renderLatex(math.trim());
        return `<span class="math-inline">${rendered}</span>`;
      })
      .replace(/\$([^$\n]+?)\$/g, (_, math) => {
        const rendered = renderLatex(math.trim());
        return `<span class="math-inline">${rendered}</span>`;
      });

    return processedText;
  };

  const detectAndFormatCalculations = (text: string) => {
    // Enhanced patterns for mathematical expressions
    const patterns = {
      // Step indicators (Step 1:, 1., etc.)
      step: /^(Step\s+\d+[:.]?|^\d+\.)/i,
      
      // Check if text contains LaTeX patterns or mathematical content
      hasLatex: /\\\(|\\\[|\$\$?|\\frac|\\sqrt|\\sum|\\int|\\arcsin|\\arccos|\\arctan|\\alpha|\\beta|\\pi|\\theta|\\sin|\\cos|\\tan|\\log|\\ln|\\operatorname/,
      
      // Mathematical equations and expressions (fallback for non-LaTeX)
      equation: /([a-zA-Z]?\s*=\s*[^=\n]+)/g,
      
      // Check for calculation blocks
      isCalculationBlock: /^Calculation\s*$/i
    };

    // Check if this is a step
    const isStep = patterns.step.test(text.trim());
    
    // Check if this is a calculation block header
    const isCalculationBlock = patterns.isCalculationBlock.test(text.trim());
    
    // Check for mathematical content
    const hasLatex = patterns.hasLatex.test(text);
    const hasEquation = patterns.equation.test(text) && !hasLatex; // Only use fallback if no LaTeX
    
    const isMathematical = hasLatex || hasEquation;

    if (isCalculationBlock) {
      return { type: 'calculation-header', content: text, isMath: false, hasLatex: false };
    } else if (isStep) {
      return { type: 'step', content: text, isMath: isMathematical, hasLatex };
    } else if (isMathematical) {
      return { type: 'calculation', content: text, isMath: true, hasLatex };
    } else {
      return { type: 'text', content: text, isMath: false, hasLatex };
    }
  };

  const formatExplanation = (explanation: string) => {
    if (!explanation) return null;

    // Split explanation into paragraphs and process each
    const paragraphs = explanation.split('\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      const formatted = detectAndFormatCalculations(paragraph);
      
      if (formatted.type === 'calculation-header') {
        return (
          <div key={index} className="flex items-center gap-2 mb-2 mt-4">
            <Calculator className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">Calculation</span>
          </div>
        );
      }
      
      if (formatted.type === 'step') {
        const processedContent = formatted.hasLatex ? 
          processLatexContent(paragraph) : 
          paragraph;
          
        return (
          <div key={index} className="flex items-start gap-3 mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <ChevronRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: processedContent }} />
              </div>
            </div>
          </div>
        );
      }
      
      if (formatted.type === 'calculation') {
        const processedContent = formatted.hasLatex ? 
          processLatexContent(paragraph) : 
          paragraph;
          
        return (
          <div key={index} className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-green-700 dark:text-green-300 text-sm bg-white dark:bg-gray-800 p-3 rounded border">
              <div dangerouslySetInnerHTML={{ __html: processedContent }} />
            </div>
          </div>
        );
      }
      
      // Regular text with potential LaTeX content
      const processedContent = processLatexContent(paragraph);
      
      return (
        <div key={index} className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
          <div dangerouslySetInnerHTML={{ __html: processedContent }} />
        </div>
      );
    });
  };

  const formatTextWithLatex = (text: string) => {
    if (!text) return text;
    return processLatexContent(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <style>
        {`
          .math-inline {
            display: inline-block;
            margin: 0 2px;
          }
          
          .math-display {
            overflow-x: auto;
            padding: 8px 0;
          }
          
          .math-display .katex-display {
            margin: 0;
          }
          
          .katex {
            font-size: 1em;
          }
          
          .katex-display > .katex {
            white-space: nowrap;
          }
        `}
      </style>
      
      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <VenoLogo className="h-5 w-5" />
              <span className="font-semibold text-sm">Detailed Explanations</span>
            </div>
          </div>
          
          {/* Score summary */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={score >= questions.length * 0.7 ? "default" : "secondary"}>
                {score}/{questions.length}
              </Badge>
              <span className="text-muted-foreground">{Math.round((score / questions.length) * 100)}%</span>
            </div>
            <span className="text-muted-foreground">{subject}</span>
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {userAnswers.map((answer, index) => {
          const question = questions[index];
          if (!question) return null;
          
          const questionText = question.text || question.question || question.question_text || '';
          const questionOptions = Array.isArray(question.options) ? question.options : [];
          const correctAnswer = question.correctOption !== undefined ? question.correctOption : 
                                question.answer !== undefined ? question.answer : 0;
          const questionExplanation = question.explanation || '';
          
          return (
            <motion.div
              key={question.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "transition-all hover:shadow-lg",
                answer.isCorrect 
                  ? "border-green-200 dark:border-green-800" 
                  : "border-red-200 dark:border-red-800"
              )}>
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full mt-1",
                      answer.isCorrect 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {answer.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-relaxed mb-3">
                        <div dangerouslySetInnerHTML={{ 
                          __html: `${index + 1}. ${formatTextWithLatex(questionText)}`
                        }} />
                      </CardTitle>
                      
                      {/* Answer options - mobile optimized */}
                      <div className="space-y-2">
                        {questionOptions.map((option: string, optionIndex: number) => (
                          <div 
                            key={optionIndex}
                            className={cn(
                              "flex items-start gap-3 py-3 px-4 rounded-lg border text-sm transition-colors",
                              optionIndex === correctAnswer 
                                ? "bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400 border-green-300 dark:border-green-700"
                                : optionIndex === answer.selectedOption && !answer.isCorrect 
                                  ? "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-300 dark:border-red-700"
                                  : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                            )}
                          >
                            <div className={cn(
                              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border-2 flex-shrink-0 mt-0.5",
                              optionIndex === correctAnswer 
                                ? "border-green-500 bg-green-500 text-white" 
                                : optionIndex === answer.selectedOption && !answer.isCorrect
                                  ? "border-red-500 bg-red-500 text-white"
                                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                            )}>
                              {String.fromCharCode(65 + optionIndex)}
                            </div>
                            <div className="flex-1 leading-relaxed">
                              <div dangerouslySetInnerHTML={{ __html: formatTextWithLatex(option) }} />
                            </div>
                            {optionIndex === correctAnswer && 
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            }
                            {optionIndex === answer.selectedOption && !answer.isCorrect && 
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  
                  {/* Answer status */}
                  <div className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border mb-4",
                    answer.isCorrect 
                      ? "bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                  )}>
                    {answer.isCorrect ? (
                      <CheckCircle size={16} className="text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className={cn(
                        "font-semibold mb-1",
                        answer.isCorrect 
                          ? "text-green-700 dark:text-green-400" 
                          : "text-red-700 dark:text-red-400"
                      )}>
                        {answer.isCorrect ? "Correct Answer!" : "Incorrect Answer"}
                      </h4>
                      <p className={cn(
                        "text-sm",
                        answer.isCorrect 
                          ? "text-green-700/80 dark:text-green-500/80" 
                          : "text-red-700/80 dark:text-red-500/80"
                      )}>
                        {answer.isCorrect 
                          ? "Great job! You selected the right option." 
                          : `You selected ${answer.selectedOption !== null && answer.selectedOption !== undefined ? 
                              `option ${String.fromCharCode(65 + answer.selectedOption)}` : 
                              "no answer"}. The correct answer is option ${String.fromCharCode(65 + correctAnswer)}.`
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Detailed explanation */}
                  <div className="bg-blue-50/80 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-semibold text-blue-700 dark:text-blue-400">Detailed Step-by-Step Explanation</h4>
                    </div>
                    <div className="space-y-2">
                      {questionExplanation ? (
                        formatExplanation(questionExplanation)
                      ) : (
                        <p className="text-blue-700/80 dark:text-blue-400/80 text-sm">
                          The correct answer is <strong>{String.fromCharCode(65 + correctAnswer)}</strong>: {
                            questionOptions[correctAnswer] || 'Not available'
                          }.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        
        {/* Bottom padding for mobile */}
        <div className="h-6" />
      </div>
    </div>
  );
};

export default DetailedExplanationView;
