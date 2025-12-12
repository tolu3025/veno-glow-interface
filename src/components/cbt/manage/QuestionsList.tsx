
import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion';
import { 
  PencilIcon, 
  Trash, 
  BookOpen, 
  Check, 
  RefreshCw,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditQuestionDialog } from './EditQuestionDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

interface QuestionsListProps {
  questions: Question[];
  loadingQuestions: boolean;
  handleEditQuestion: (updatedQuestion: Question) => Promise<void>;
  handleDeleteQuestion: (questionId: string) => Promise<void>;
  fetchTestQuestions: () => Promise<void>;
}

// Preprocess LaTeX to convert \( \) and \[ \] to $ and $$ for remark-math
const preprocessLatex = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$');
};

export const QuestionsList = ({
  questions,
  loadingQuestions,
  handleEditQuestion,
  handleDeleteQuestion,
  fetchTestQuestions
}: QuestionsListProps) => {
  const { toast } = useToast();
  const [selectedQuestion, setSelectedQuestion] = React.useState<Question | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [localQuestions, setLocalQuestions] = React.useState<Question[]>([]);

  // Update local questions when prop changes
  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  const onEditClick = (question: Question) => {
    setSelectedQuestion(question);
    setIsEditDialogOpen(true);
  };

  const handleRefreshQuestions = async () => {
    setIsRefreshing(true);
    try {
      await fetchTestQuestions();
      toast({
        title: "Questions Refreshed",
        description: "The questions list has been updated from the database.",
      });
    } catch (error) {
      console.error('Error refreshing questions:', error);
      toast({
        title: "Error",
        description: "Failed to refresh questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveQuestion = async (updatedQuestion: Question) => {
    try {
      await handleEditQuestion(updatedQuestion);
      
      // Update local state immediately
      setLocalQuestions(prev => 
        prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
      );
      
      setIsEditDialogOpen(false);
      toast({
        title: "Question Updated",
        description: "The question has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update the question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLocalDelete = async (questionId: string) => {
    try {
      await handleDeleteQuestion(questionId);
      
      // Remove from local state immediately
      setLocalQuestions(prev => prev.filter(q => q.id !== questionId));
      
      toast({
        title: "Question Deleted",
        description: "The question has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Refresh questions periodically
  useEffect(() => {
    // Auto-refresh questions every 30 seconds while this component is open
    const refreshInterval = setInterval(() => {
      if (!loadingQuestions && !isRefreshing) {
        fetchTestQuestions().catch(console.error);
      }
    }, 30000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchTestQuestions, loadingQuestions, isRefreshing]);

  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-veno-primary" />
          <h2 className="text-xl font-bold">Questions ({localQuestions.length})</h2>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefreshQuestions}
          disabled={loadingQuestions || isRefreshing}
          className="flex items-center gap-1"
        >
          {(loadingQuestions || isRefreshing) ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Refresh Questions
        </Button>
      </div>
      
      {loadingQuestions ? (
        <Card>
          <CardContent className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-veno-primary" />
          </CardContent>
        </Card>
      ) : localQuestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">
              No questions found for this test
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {localQuestions.map((question, index) => (
            <motion.div 
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between">
                    <span>Question {index + 1}</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onEditClick(question)}
                        className="h-8 px-2"
                      >
                        <PencilIcon size={16} />
                        <span className="ml-1">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash size={16} />
                            <span className="ml-1">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Question</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this question? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleLocalDelete(question.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete Question
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({ children }) => <p>{children}</p>,
                      }}
                    >
                      {preprocessLatex(question.question)}
                    </ReactMarkdown>
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div 
                        key={optionIndex} 
                        className={`p-3 rounded-md border ${
                          optionIndex === question.answer ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${
                            optionIndex === question.answer ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            {String.fromCharCode(65 + optionIndex)}
                          </div>
                          <div>
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                p: ({ children }) => <span>{children}</span>,
                              }}
                            >
                              {preprocessLatex(option)}
                            </ReactMarkdown>
                          </div>
                          {optionIndex === question.answer && (
                            <Check size={16} className="ml-2 text-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {question.explanation ? (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <BookOpen size={20} className="mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Explanation:</p>
                          <div>
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                p: ({ children }) => <p className="text-blue-700 dark:text-blue-300/90">{children}</p>,
                              }}
                            >
                              {preprocessLatex(question.explanation || '')}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-md border border-gray-200 dark:border-gray-700 text-muted-foreground text-sm italic">
                      No explanation provided for this question
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      <EditQuestionDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        question={selectedQuestion}
        onSave={handleSaveQuestion}
      />
    </>
  );
};
