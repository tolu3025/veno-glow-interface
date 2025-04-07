
import { useState, useEffect } from "react";
import { Loader2, Search, Filter, Plus, CheckCircle, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  subject?: string;
  question: string;
  options: string[];
  answer: number;
  difficulty?: string;
  explanation?: string;
}

interface QuestionBankPanelProps {
  testId: string;
  onQuestionsAdded?: () => void;
}

const QuestionBankPanel = ({ testId, onQuestionsAdded }: QuestionBankPanelProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [addingQuestions, setAddingQuestions] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  
  useEffect(() => {
    fetchQuestions();
    fetchSubjects();
  }, []);
  
  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('subject')
        .order('subject')
        .is('subject', 'not.null');
        
      if (error) throw error;
      
      // Extract unique subjects
      const uniqueSubjects = Array.from(new Set(
        data.map(item => item.subject).filter(Boolean)
      )) as string[];
      
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };
  
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Create the base query
      let query = supabase.from('questions').select('*');
      
      // Apply filters if provided
      if (selectedSubject) {
        query = query.ilike('subject', selectedSubject);
      }
      
      if (difficulty) {
        query = query.eq('difficulty', difficulty as any);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // Properly format the questions, ensuring options is always a string array
        const formattedQuestions: Question[] = data.map(q => ({
          id: q.id,
          subject: q.subject,
          question: q.question,
          // Convert options to string array with proper type handling
          options: Array.isArray(q.options) ? q.options.map(String) : 
                  (typeof q.options === 'object' && q.options !== null ? 
                   Object.values(q.options).map(String) : []),
          answer: q.answer,
          difficulty: q.difficulty,
          explanation: q.explanation || ''
        }));
        
        setQuestions(formattedQuestions);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions from the bank");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selectedSubject, difficulty]);
  
  const handleAddSelectedQuestions = async () => {
    if (selectedQuestions.length === 0) {
      toast.error("No questions selected");
      return;
    }
    
    setAddingQuestions(true);
    try {
      // Get the selected questions
      const selectedQuestionsData = questions.filter(q => 
        selectedQuestions.includes(q.id)
      );
      
      // Add each question to the test
      const newQuestions = selectedQuestionsData.map(q => ({
        test_id: testId,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation || null
      }));
      
      const { error } = await supabase
        .from('test_questions')
        .insert(newQuestions);
        
      if (error) throw error;
      
      // Get the updated count directly from the database
      const { count, error: countError } = await supabase
        .from('test_questions')
        .select('*', { count: 'exact', head: true })
        .eq('test_id', testId);
        
      if (countError) throw countError;
      
      // Update the question count in the user_tests table
      const { error: updateError } = await supabase
        .from('user_tests')
        .update({ question_count: count as number })
        .eq('id', testId);
        
      if (updateError) throw updateError;
      
      toast.success(`${selectedQuestions.length} questions added to the test`);
      setSelectedQuestions([]);
      
      if (onQuestionsAdded) {
        onQuestionsAdded();
      }
    } catch (error) {
      console.error("Error adding questions:", error);
      toast.error("Failed to add questions to the test");
    } finally {
      setAddingQuestions(false);
    }
  };
  
  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };
  
  const filteredQuestions = questions.filter(question => 
    question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (question.subject && question.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const clearFilters = () => {
    setSelectedSubject("");
    setDifficulty("");
    setSearchTerm("");
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search questions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <select 
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          
          <select 
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          
          {(selectedSubject || difficulty || searchTerm) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="h-10"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      
      {selectedQuestions.length > 0 && (
        <div className="bg-secondary/30 p-3 rounded-md flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="font-medium">{selectedQuestions.length} questions selected</span>
          </div>
          <Button
            size="sm"
            onClick={handleAddSelectedQuestions}
            disabled={addingQuestions}
            className="flex items-center gap-1"
          >
            {addingQuestions ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {addingQuestions ? "Adding..." : "Add to Test"}
          </Button>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground">No questions found with the current filters</p>
            {(selectedSubject || difficulty || searchTerm) && (
              <Button 
                variant="link" 
                onClick={clearFilters}
                className="mt-2"
              >
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card 
              key={question.id} 
              className={`cursor-pointer transition-colors ${
                selectedQuestions.includes(question.id) 
                  ? 'border-primary/50 bg-primary/5' 
                  : ''
              }`}
              onClick={() => toggleQuestionSelection(question.id)}
            >
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {selectedQuestions.includes(question.id) ? (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <CardTitle className="text-base font-medium">
                      {question.question}
                    </CardTitle>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {question.subject && (
                      <Badge variant="outline" className="text-xs">
                        {question.subject}
                      </Badge>
                    )}
                    {question.difficulty && (
                      <Badge 
                        className={`text-xs ${
                          question.difficulty === 'easy'
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                            : question.difficulty === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-500/20 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {question.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {question.options.map((option, index) => (
                    <div 
                      key={index}
                      className={`text-sm p-2 border rounded-md ${
                        index === question.answer
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20 dark:border-green-800'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <span className="font-medium mr-1">
                        {String.fromCharCode(65 + index)}:
                      </span>
                      {option}
                    </div>
                  ))}
                </div>
                
                {question.explanation && (
                  <div className="mt-3 text-sm text-muted-foreground italic">
                    <span className="font-medium">Explanation:</span> {question.explanation}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionBankPanel;
