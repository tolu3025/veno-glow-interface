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
import { Search, BookOpen, FileText, Loader2, GraduationCap, ArrowLeft, Upload, Check, X, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LaTeXText from '@/components/ui/latex-text';
import StudentDocumentUpload from '@/components/cbt/StudentDocumentUpload';
import { useIsMobile } from '@/hooks/use-mobile';

interface CourseMaterial {
  id: string;
  course_name: string;
  course_code: string;
  course_title: string;
  institution?: string;
  department?: string;
  file_content?: string;
  file_url?: string;
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

// Search results state for multiple courses
interface SearchResults {
  materials: CourseMaterial[];
  hasSearched: boolean;
}

const CourseMaterialTest = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [foundMaterial, setFoundMaterial] = useState<CourseMaterial | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults>({ materials: [], hasSearched: false });
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
    setSearchResults({ materials: [], hasSearched: false });

    try {
      let query = supabase.from('course_materials').select('*');

      // Build flexible OR query for partial matching
      const searchTerms: string[] = [];
      
      if (searchQuery.trim()) {
        const term = searchQuery.trim().toLowerCase();
        searchTerms.push(
          `course_name.ilike.%${term}%`,
          `course_code.ilike.%${term}%`,
          `course_title.ilike.%${term}%`,
          `department.ilike.%${term}%`,
          `institution.ilike.%${term}%`
        );
      }
      if (courseCode.trim()) {
        searchTerms.push(`course_code.ilike.%${courseCode.trim()}%`);
      }
      if (courseTitle.trim()) {
        searchTerms.push(`course_title.ilike.%${courseTitle.trim()}%`);
      }

      if (searchTerms.length > 0) {
        query = query.or(searchTerms.join(','));
      }

      // Fetch multiple results instead of just one
      const { data, error } = await query
        .order('course_name', { ascending: true })
        .limit(50);

      if (error) throw error;

      const materials = (data as CourseMaterial[]) || [];
      setSearchResults({ materials, hasSearched: true });

      if (materials.length === 0) {
        toast.info('No course materials found matching your search');
      } else if (materials.length === 1) {
        // Auto-select if only one result
        setFoundMaterial(materials[0]);
        toast.success('Course material found!');
      } else {
        toast.success(`Found ${materials.length} matching courses`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search for course materials');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCourse = (course: CourseMaterial) => {
    setFoundMaterial(course);
    setSearchResults({ materials: [], hasSearched: false });
    toast.success('Course selected!');
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
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6 sm:py-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Course Material Test</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Generate questions from class PDFs</p>
            </div>
          </div>

          {!generatedQuestions ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="search" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Search</span> Course
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Upload</span> Document
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4 sm:space-y-6 mt-4">
                {/* Search Form */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Find Course Material
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Search by course name, code, or title
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="search" className="text-sm">Course Name or Code</Label>
                      <Input
                        id="search"
                        placeholder="e.g., Introduction to Programming or CSC101"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm">Course Code</Label>
                        <Input
                          id="code"
                          placeholder="e.g., CSC101"
                          value={courseCode}
                          onChange={(e) => setCourseCode(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm">Course Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Computer Science 101"
                          value={courseTitle}
                          onChange={(e) => setCourseTitle(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleSearch} 
                      className="w-full"
                      disabled={isSearching}
                      size={isMobile ? "default" : "lg"}
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

                {/* Search Results - Multiple Courses */}
                {searchResults.hasSearched && searchResults.materials.length > 1 && !foundMaterial && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          Search Results
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Found {searchResults.materials.length} matching courses. Select one to continue.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                          {searchResults.materials.map((course) => (
                            <div
                              key={course.id}
                              onClick={() => handleSelectCourse(course)}
                              className="p-3 sm:p-4 border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-all"
                            >
                              <div className="flex items-start justify-between gap-2 sm:gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                    <Badge variant="secondary" className="text-xs">{course.course_code}</Badge>
                                    {course.institution && (
                                      <Badge variant="outline" className="text-xs truncate max-w-[120px]">{course.institution}</Badge>
                                    )}
                                    {course.department && (
                                      <Badge variant="outline" className="text-xs truncate max-w-[120px]">{course.department}</Badge>
                                    )}
                                  </div>
                                  <h4 className="font-medium text-sm sm:text-base truncate">{course.course_name}</h4>
                                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{course.course_title}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="flex-shrink-0">
                                  Select
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* No Results Found */}
                {searchResults.hasSearched && searchResults.materials.length === 0 && !foundMaterial && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-dashed border-2">
                      <CardContent className="p-6 text-center space-y-4">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">No Courses Found</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            No materials found matching your search. You can upload your own document instead.
                          </p>
                        </div>
                        <Button onClick={() => setActiveTab('upload')} className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Your Document
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Found Material */}
                {foundMaterial && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="border-primary/50">
                      <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          Course Material Found
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">{foundMaterial.course_code}</Badge>
                            {foundMaterial.institution && (
                              <Badge variant="outline" className="text-xs">{foundMaterial.institution}</Badge>
                            )}
                            {foundMaterial.department && (
                              <Badge variant="outline" className="text-xs">{foundMaterial.department}</Badge>
                            )}
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold">{foundMaterial.course_name}</h3>
                          <p className="text-sm text-muted-foreground">{foundMaterial.course_title}</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Difficulty Level</Label>
                          <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          {foundMaterial.file_url && (
                            <Button 
                              variant="outline"
                              className="flex-1"
                              size={isMobile ? "default" : "lg"}
                              onClick={() => window.open(foundMaterial.file_url, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                          <Button 
                            onClick={handleGenerateQuestions}
                            className="flex-1"
                            size={isMobile ? "default" : "lg"}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <GraduationCap className="h-4 w-4 mr-2" />
                                Generate Questions
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <StudentDocumentUpload onQuestionsGenerated={handleDocumentProcessed} />
              </TabsContent>
            </Tabs>
          ) : (
            /* Questions Display */
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span className="truncate">{generatedQuestions.course.course_name}</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm truncate">
                        {generatedQuestions.course.course_code} - {generatedQuestions.course.course_title}
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setGeneratedQuestions(null)} size="sm">
                      New Test
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Section Tabs */}
              <Tabs value={currentSection} onValueChange={setCurrentSection}>
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="A" className="text-xs sm:text-sm py-2">
                    Section A ({generatedQuestions.sections.sectionA.length})
                  </TabsTrigger>
                  <TabsTrigger value="B" className="text-xs sm:text-sm py-2">
                    Section B ({generatedQuestions.sections.sectionB.length})
                  </TabsTrigger>
                  <TabsTrigger value="C" className="text-xs sm:text-sm py-2">
                    Section C ({generatedQuestions.sections.sectionC.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="A" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg">Objective Questions</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Select the correct option for each question</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      {generatedQuestions.sections.sectionA.map((q, idx) => (
                        <div key={q.id} className="p-3 sm:p-4 border rounded-lg space-y-3">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <span className="font-bold text-primary text-sm sm:text-base">{idx + 1}.</span>
                            <LaTeXText className="flex-1 text-sm sm:text-base">{q.question}</LaTeXText>
                          </div>
                          <div className="flex flex-col gap-2 pl-0 sm:pl-4 mt-2">
                            {q.options.map((option, optIdx) => {
                              const isSelected = userAnswers[`A-${q.id}`] === optIdx;
                              const isCorrect = showResults && q.correctAnswer === optIdx;
                              const isWrong = showResults && isSelected && q.correctAnswer !== optIdx;
                              
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  className={`
                                    flex items-start gap-2 w-full min-h-[44px] p-3 rounded-lg border text-left transition-colors
                                    ${isSelected && !showResults ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-accent'}
                                    ${isCorrect ? 'bg-green-500 text-white border-green-500' : ''}
                                    ${isWrong ? 'bg-red-500 text-white border-red-500' : ''}
                                    ${showResults ? 'cursor-default' : 'cursor-pointer'}
                                  `}
                                  onClick={() => !showResults && handleAnswerSelect(`A-${q.id}`, optIdx)}
                                  disabled={showResults}
                                >
                                  <span className="font-semibold flex-shrink-0 min-w-[20px]">
                                    {['A', 'B', 'C', 'D'][optIdx]}.
                                  </span>
                                  <span className="flex-1 break-words text-sm leading-relaxed">
                                    <LaTeXText>{option}</LaTeXText>
                                  </span>
                                  {isCorrect && <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                                  {isWrong && <X className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="B" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg">Short Answer Questions</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Provide brief answers (2-3 sentences)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      {generatedQuestions.sections.sectionB.map((q, idx) => (
                        <div key={q.id} className="p-3 sm:p-4 border rounded-lg space-y-3">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <span className="font-bold text-primary text-sm sm:text-base">{idx + 1}.</span>
                            <LaTeXText className="flex-1 text-sm sm:text-base">{q.question}</LaTeXText>
                          </div>
                          <textarea
                            className="w-full min-h-[80px] sm:min-h-[100px] p-2 sm:p-3 border rounded-lg resize-y bg-background text-sm"
                            placeholder="Enter your answer..."
                            value={userAnswers[`B-${q.id}`] || ''}
                            onChange={(e) => handleAnswerSelect(`B-${q.id}`, e.target.value)}
                          />
                          {showResults && q.expectedAnswer && (
                            <div className="p-2 sm:p-3 bg-muted rounded-lg">
                              <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Expected Answer:</p>
                              <LaTeXText className="text-sm">{q.expectedAnswer}</LaTeXText>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="C" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg">Essay Questions</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Provide detailed explanations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      {generatedQuestions.sections.sectionC.map((q, idx) => (
                        <div key={q.id} className="p-3 sm:p-4 border rounded-lg space-y-3">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <span className="font-bold text-primary text-sm sm:text-base">{idx + 1}.</span>
                            <LaTeXText className="flex-1 text-sm sm:text-base">{q.question}</LaTeXText>
                          </div>
                          <textarea
                            className="w-full min-h-[150px] sm:min-h-[200px] p-2 sm:p-3 border rounded-lg resize-y bg-background text-sm"
                            placeholder="Enter your essay response..."
                            value={userAnswers[`C-${q.id}`] || ''}
                            onChange={(e) => handleAnswerSelect(`C-${q.id}`, e.target.value)}
                          />
                          {showResults && q.keyPoints && (
                            <div className="p-2 sm:p-3 bg-muted rounded-lg">
                              <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Key Points:</p>
                              <LaTeXText className="text-sm">{q.keyPoints}</LaTeXText>
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
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">
                      Section A Score: {calculateScore()}/{generatedQuestions.sections.sectionA.length}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
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
