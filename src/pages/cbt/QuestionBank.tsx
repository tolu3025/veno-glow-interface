
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  FilterIcon, 
  CheckCircle2,
  Book, 
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

type QuestionBankItem = {
  id: string;
  question_text: string;
  options: string[];
  answer: number;
  explanation: string | null;
  subject: string;
  difficulty: string;
  selected: boolean;
};

const QuestionBank = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [questions, searchQuery, subjectFilter, difficultyFilter, activeTab]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      // Fetch questions from the database
      const { data, error } = await supabase
        .from('questions')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Map the database fields to QuestionBankItem format and ensure correct types
        const formattedQuestions: QuestionBankItem[] = data.map(q => ({
          id: q.id,
          question_text: q.question,
          // Make sure options is converted to string[] - handle various possible formats
          options: Array.isArray(q.options) 
            ? q.options.map(opt => String(opt)) 
            : [],
          answer: q.answer,
          explanation: q.explanation,
          subject: q.subject,
          difficulty: q.difficulty || 'intermediate',
          selected: false
        }));
        
        setQuestions(formattedQuestions);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error loading questions",
        description: "We couldn't load the question bank. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...questions];
    
    // Apply subject filter
    if (subjectFilter !== "all") {
      filtered = filtered.filter(q => q.subject === subjectFilter);
    }
    
    // Apply difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(query) || 
        q.options.some(opt => opt.toLowerCase().includes(query))
      );
    }
    
    // Apply tab filter
    if (activeTab === "selected") {
      filtered = filtered.filter(q => q.selected);
    }
    
    setFilteredQuestions(filtered);
  };

  const toggleQuestionSelection = (id: string) => {
    const updatedQuestions = questions.map(q => {
      if (q.id === id) {
        return { ...q, selected: !q.selected };
      }
      return q;
    });
    
    setQuestions(updatedQuestions);
    setSelectedCount(updatedQuestions.filter(q => q.selected).length);
  };

  const addSelectedToTest = () => {
    const selectedQuestions = questions.filter(q => q.selected);
    
    if (selectedQuestions.length === 0) {
      toast({
        title: "No questions selected",
        description: "Please select at least one question to add to your test.",
        variant: "destructive",
      });
      return;
    }
    
    // Format questions for the test creator
    const formattedQuestions = selectedQuestions.map(q => ({
      id: crypto.randomUUID(),
      text: q.question_text,
      options: q.options,
      correctOption: q.answer,
      explanation: q.explanation || "",
    }));
    
    // Retrieve existing test data from localStorage
    const existingQuestionsJson = localStorage.getItem('currentQuestions');
    let existingQuestions = existingQuestionsJson ? JSON.parse(existingQuestionsJson) : [];
    
    // Combine with new questions
    const combinedQuestions = [...existingQuestions, ...formattedQuestions];
    
    // Save back to localStorage
    localStorage.setItem('currentQuestions', JSON.stringify(combinedQuestions));
    
    toast({
      title: "Questions added",
      description: `${selectedQuestions.length} questions have been added to your test.`,
    });
    
    // Navigate back to test creation
    navigate('/cbt/create');
  };

  const subjects = [
    { value: "all", label: "All Subjects" },
    { value: "General", label: "General" },
    { value: "Mathematics", label: "Mathematics" },
    { value: "Science", label: "Science" },
    { value: "English", label: "English" },
    { value: "Programming", label: "Programming" },
  ];

  const difficulties = [
    { value: "all", label: "All Difficulties" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  return (
    <div className="pb-14">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => navigate('/cbt/create')}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Question Bank</h1>
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search questions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Select
            value={subjectFilter}
            onValueChange={setSubjectFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.value} value={subject.value}>
                  {subject.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={difficultyFilter}
            onValueChange={setDifficultyFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((difficulty) => (
                <SelectItem key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            <Book size={16} className="mr-2" /> All Questions
          </TabsTrigger>
          <TabsTrigger value="selected" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            <CheckCircle2 size={16} className="mr-2" /> Selected ({selectedCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-veno-primary"></div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-8">
          <Book className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No questions found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card 
              key={question.id} 
              className={`cursor-pointer transition-all ${
                question.selected 
                  ? 'border-veno-primary bg-veno-primary/5' 
                  : 'hover:border-veno-primary/30'
              }`}
              onClick={() => toggleQuestionSelection(question.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                        {question.subject}
                      </span>
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full capitalize">
                        {question.difficulty}
                      </span>
                    </div>
                    <p className="font-medium">{question.question_text}</p>
                    
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {question.options.map((option, idx) => (
                        <div 
                          key={idx} 
                          className={`text-sm p-2 rounded border ${
                            idx === question.answer 
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}. {option}
                          {idx === question.answer && ' ✓'}
                        </div>
                      ))}
                    </div>
                    
                    {question.explanation && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                      question.selected 
                        ? 'bg-veno-primary text-white' 
                        : 'border border-muted-foreground/30'
                    }`}>
                      {question.selected && <CheckCircle2 size={16} />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10 flex justify-between md:static md:mt-6 md:p-0 md:border-0">
        <Button variant="outline" onClick={() => navigate('/cbt/create')}>
          Cancel
        </Button>
        
        <Button 
          className="bg-veno-primary hover:bg-veno-primary/90"
          onClick={addSelectedToTest}
          disabled={selectedCount === 0}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add to Test ({selectedCount})
        </Button>
      </div>
    </div>
  );
};

export default QuestionBank;
