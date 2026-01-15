import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, BookOpen, FileText, Loader2, GraduationCap, ArrowLeft, Upload, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LaTeXText from '@/components/ui/latex-text';
import StudentDocumentUpload from '@/components/cbt/StudentDocumentUpload';

interface CourseMaterial {
  id: string;
  course_name: string;
  course_code: string;
  course_title: string;
  institution?: string;
  department?: string;
  file_content?: string;
}

interface GeneratedQuestions {
  questions: string;
  sections: {
    sectionA: Array<{
      id: number;
      question: string;
      options: string[];
      correctAnswer: number;
      type: string;
    }>;
    sectionB: Array<{
      id: number;
      question: string;
      expectedAnswer: string;
      type: string;
    }>;
    sectionC: Array<{
      id: number;
      question: string;
      keyPoints: string;
      type: string;
    }>;
  };
  course: {
    course_name: string;
    course_code: string;
    course_title: string;
  };
}

const CourseMaterialTest = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [foundMaterial, setFoundMaterial] = useState<CourseMaterial | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestions | null>(null);
  const [activeTab, setActiveTab] = useState('search');
  const [currentSection, setCurrentSection] = useState('A');
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() && !courseCode.trim() && !courseTitle.trim()) {
      toast.error('Please enter at least one search term');
      return;
    }

    setIsSearching(true);
    setFoundMaterial(null);

    try {
      let query = supabase.from('course_materials').select('*');

      if (searchQuery.trim()) {
        query = query.or(`course_name.ilike.%${searchQuery}%,course_code.ilike.%${searchQuery}%,course_title.ilike.%${searchQuery}%`);
      }
      if (courseCode.trim()) {
        query = query.ilike('course_code', `%${courseCode}%`);
      }
      if (courseTitle.trim()) {
        query = query.ilike('course_title', `%${courseTitle}%`);
      }

      const { data, error } = await query.limit(1).single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast.info('No course material found matching your search');
        } else {
          throw error;
        }
      } else {
        setFoundMaterial(data as CourseMaterial);
        toast.success('Course material found!');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search for course materials');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!foundMaterial?.file_content) {
      toast.error('No document content available');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-questions', {
        body: {
          course_name: foundMaterial.course_name,
          course_code: foundMaterial.course_code,
          course_title: foundMaterial.course_title,
          pdf_content: foundMaterial.file_content,
          difficulty
        }
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedQuestions(data);
        toast.success('Questions generated successfully!');
      } else {
        toast.error(data.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDocumentProcessed = (questions: GeneratedQuestions) => {
    setGeneratedQuestions(questions);
    setActiveTab('questions');
  };

  const handleAnswerSelect = (questionId: string, answer: any) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    if (!generatedQuestions) return 0;
    
    let correct = 0;
    generatedQuestions.sections.sectionA.forEach(q => {
      if (userAnswers[`A-${q.id}`] === q.correctAnswer) {
        correct++;
      }
    });
    
    return correct;
  };

  const handleSubmitTest = () => {
    setShowResults(true);
    const score = calculateScore();
    const total = generatedQuestions?.sections.sectionA.length || 0;
    toast.success(`Test submitted! You scored ${score}/${total} in Section A`);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Course Material Test</h1>
              <p className="text-muted-foreground">Generate questions from class PDFs</p>
            </div>
          </div>

          {!generatedQuestions ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search" className="gap-2">
                  <Search className="h-4 w-4" />
                  Search Course
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-6">
                {/* Search Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Find Course Material
                    </CardTitle>
                    <CardDescription>
                      Search by course name, code, or title
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Course Name or Code</Label>
                      <Input
                        id="search"
                        placeholder="e.g., Introduction to Programming or CSC101"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Course Code</Label>
                        <Input
                          id="code"
                          placeholder="e.g., CSC101"
                          value={courseCode}
                          onChange={(e) => setCourseCode(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Course Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Computer Science 101"
                          value={courseTitle}
                          onChange={(e) => setCourseTitle(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleSearch} 
                      className="w-full"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search Course
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Found Material */}
                {foundMaterial && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="border-primary/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          Course Material Found
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{foundMaterial.course_code}</Badge>
                            {foundMaterial.institution && (
                              <Badge variant="outline">{foundMaterial.institution}</Badge>
                            )}
                            {foundMaterial.department && (
                              <Badge variant="outline">{foundMaterial.department}</Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold">{foundMaterial.course_name}</h3>
                          <p className="text-muted-foreground">{foundMaterial.course_title}</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Difficulty Level</Label>
                          <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button 
                          onClick={handleGenerateQuestions}
                          className="w-full"
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating Questions...
                            </>
                          ) : (
                            <>
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Generate Test Questions
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="upload">
                <StudentDocumentUpload onQuestionsGenerated={handleDocumentProcessed} />
              </TabsContent>
            </Tabs>
          ) : (
            /* Questions Display */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        {generatedQuestions.course.course_name}
                      </CardTitle>
                      <CardDescription>
                        {generatedQuestions.course.course_code} - {generatedQuestions.course.course_title}
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setGeneratedQuestions(null)}>
                      New Test
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Section Tabs */}
              <Tabs value={currentSection} onValueChange={setCurrentSection}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="A">
                    Section A ({generatedQuestions.sections.sectionA.length})
                  </TabsTrigger>
                  <TabsTrigger value="B">
                    Section B ({generatedQuestions.sections.sectionB.length})
                  </TabsTrigger>
                  <TabsTrigger value="C">
                    Section C ({generatedQuestions.sections.sectionC.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="A" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Objective Questions</CardTitle>
                      <CardDescription>Select the correct option for each question</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {generatedQuestions.sections.sectionA.map((q, idx) => (
                        <div key={q.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="font-bold text-primary">{idx + 1}.</span>
                            <LaTeXText className="flex-1">{q.question}</LaTeXText>
                          </div>
                          <div className="grid gap-2 pl-6">
                            {q.options.map((option, optIdx) => {
                              const isSelected = userAnswers[`A-${q.id}`] === optIdx;
                              const isCorrect = showResults && q.correctAnswer === optIdx;
                              const isWrong = showResults && isSelected && q.correctAnswer !== optIdx;
                              
                              return (
                                <Button
                                  key={optIdx}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`justify-start h-auto py-2 px-3 ${
                                    isCorrect ? 'bg-green-500 hover:bg-green-600 text-white' :
                                    isWrong ? 'bg-red-500 hover:bg-red-600 text-white' : ''
                                  }`}
                                  onClick={() => !showResults && handleAnswerSelect(`A-${q.id}`, optIdx)}
                                  disabled={showResults}
                                >
                                  <span className="font-semibold mr-2">
                                    {['A', 'B', 'C', 'D'][optIdx]}.
                                  </span>
                                  <LaTeXText>{option}</LaTeXText>
                                  {isCorrect && <Check className="h-4 w-4 ml-auto" />}
                                  {isWrong && <X className="h-4 w-4 ml-auto" />}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="B" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Short Answer Questions</CardTitle>
                      <CardDescription>Provide brief answers (2-3 sentences)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {generatedQuestions.sections.sectionB.map((q, idx) => (
                        <div key={q.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="font-bold text-primary">{idx + 1}.</span>
                            <LaTeXText className="flex-1">{q.question}</LaTeXText>
                          </div>
                          <textarea
                            className="w-full min-h-[100px] p-3 border rounded-lg resize-y bg-background"
                            placeholder="Enter your answer..."
                            value={userAnswers[`B-${q.id}`] || ''}
                            onChange={(e) => handleAnswerSelect(`B-${q.id}`, e.target.value)}
                          />
                          {showResults && q.expectedAnswer && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm font-semibold text-muted-foreground">Expected Answer:</p>
                              <LaTeXText>{q.expectedAnswer}</LaTeXText>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="C" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Essay Questions</CardTitle>
                      <CardDescription>Provide detailed explanations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {generatedQuestions.sections.sectionC.map((q, idx) => (
                        <div key={q.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="font-bold text-primary">{idx + 1}.</span>
                            <LaTeXText className="flex-1">{q.question}</LaTeXText>
                          </div>
                          <textarea
                            className="w-full min-h-[200px] p-3 border rounded-lg resize-y bg-background"
                            placeholder="Enter your essay response..."
                            value={userAnswers[`C-${q.id}`] || ''}
                            onChange={(e) => handleAnswerSelect(`C-${q.id}`, e.target.value)}
                          />
                          {showResults && q.keyPoints && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm font-semibold text-muted-foreground">Key Points:</p>
                              <LaTeXText>{q.keyPoints}</LaTeXText>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Submit Button */}
              {!showResults && (
                <Button onClick={handleSubmitTest} className="w-full" size="lg">
                  Submit Test
                </Button>
              )}

              {showResults && (
                <Card className="border-primary/50">
                  <CardContent className="pt-6 text-center">
                    <h3 className="text-2xl font-bold mb-2">
                      Section A Score: {calculateScore()}/{generatedQuestions.sections.sectionA.length}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Review Section B and C answers above for expected responses
                    </p>
                    <Button onClick={() => {
                      setShowResults(false);
                      setUserAnswers({});
                      setGeneratedQuestions(null);
                    }}>
                      Start New Test
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CourseMaterialTest;
