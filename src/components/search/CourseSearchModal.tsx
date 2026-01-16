import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, FileText, Upload, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CourseMaterial {
  id: string;
  course_name: string;
  course_code: string;
  course_title: string;
  institution?: string;
  department?: string;
}

interface CourseSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CourseSearchModal: React.FC<CourseSearchModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CourseMaterial[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a course name or code');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const query = searchQuery.trim().toLowerCase();
      
      // Build flexible search - match partial inputs (even 2-3 letters)
      // Search across course_name, course_code, course_title, department, and institution
      const { data, error } = await supabase
        .from('course_materials')
        .select('id, course_name, course_code, course_title, institution, department')
        .or(`course_name.ilike.%${query}%,course_code.ilike.%${query}%,course_title.ilike.%${query}%,department.ilike.%${query}%,institution.ilike.%${query}%`)
        .order('course_name', { ascending: true })
        .limit(50); // Increased limit to show more results

      if (error) throw error;
      setSearchResults((data as CourseMaterial[]) || []);
      
      if (!data || data.length === 0) {
        // Don't show error, we'll show the upload prompt instead
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search courses');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCourseSelect = (course: CourseMaterial) => {
    onOpenChange(false);
    navigate('/cbt/course-material-test', { state: { selectedCourse: course } });
  };

  const handleUploadDocument = () => {
    onOpenChange(false);
    navigate('/cbt/course-material-test', { state: { openUpload: true } });
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Course Materials
          </DialogTitle>
          <DialogDescription>
            Find your course and generate practice questions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter course name or code (e.g., CSC101)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              autoFocus
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Found {searchResults.length} course{searchResults.length > 1 ? 's' : ''}{searchResults.length >= 50 ? '+' : ''}
              </p>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {searchResults.map((course) => (
                  <Card 
                    key={course.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleCourseSelect(course)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <Badge variant="secondary" className="text-xs">{course.course_code}</Badge>
                            {course.institution && (
                              <Badge variant="outline" className="text-xs truncate max-w-[100px]">{course.institution}</Badge>
                            )}
                            {course.department && (
                              <Badge variant="outline" className="text-xs truncate max-w-[100px]">{course.department}</Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-sm sm:text-base truncate">{course.course_name}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{course.course_title}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Results - Upload Prompt */}
          {hasSearched && searchResults.length === 0 && !isSearching && (
            <Card className="border-dashed border-2">
              <CardContent className="p-6 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Course Not Found</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    No materials found for "{searchQuery}". You can upload your own document to generate questions.
                  </p>
                </div>
                <Button onClick={handleUploadDocument} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Your Document
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {!hasSearched && (
            <div className="pt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Quick Actions</p>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/cbt/course-material-test');
                  }}
                >
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-xs">Browse All</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={handleUploadDocument}
                >
                  <Upload className="h-5 w-5 text-primary" />
                  <span className="text-xs">Upload Document</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseSearchModal;
