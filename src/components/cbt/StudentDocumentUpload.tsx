import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X, File, AlertCircle, BookOpen, PenTool } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import DocumentProcessingAnimation from './DocumentProcessingAnimation';

interface StudentDocumentUploadProps {
  onQuestionsGenerated: (questions: any) => void;
  /** If provided, reuse this extracted text instead of uploading again */
  existingContent?: string | null;
  existingFileName?: string | null;
  onContentExtracted?: (content: string, fileName: string) => void;
  onUploadNew?: () => void;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const StudentDocumentUpload: React.FC<StudentDocumentUploadProps> = ({ 
  onQuestionsGenerated, 
  existingContent, 
  existingFileName,
  onContentExtracted,
  onUploadNew
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'extracting' | 'analyzing' | 'generating' | 'complete'>('extracting');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<'mcq' | 'essay' | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(existingContent || null);

  const hasDocument = !!extractedText || !!file;
  const displayFileName = existingFileName || file?.name || '';

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Please upload PDF, DOCX, PPTX, or TXT files.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 10MB.';
    }
    return null;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    setError(null);
    setFile(selectedFile);
    setExtractedText(null);
    setQuestionType(null);
    toast.success(`File "${selectedFile.name}" selected`);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setExtractedText(null);
    setQuestionType(null);
    setError(null);
  };

  const getFileIcon = () => {
    if (!file && !existingContent) return <Upload className="h-8 w-8 text-muted-foreground" />;
    const ext = displayFileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return <FileText className="h-8 w-8 text-red-500" />;
      case 'docx': case 'doc': return <FileText className="h-8 w-8 text-blue-500" />;
      case 'pptx': case 'ppt': return <FileText className="h-8 w-8 text-orange-500" />;
      default: return <File className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const handleGenerate = async () => {
    if (!questionType) {
      toast.error('Please select a question type (MCQ or Essay)');
      return;
    }

    setIsProcessing(true);
    setProcessingStage('extracting');
    setError(null);

    try {
      let contentToUse = extractedText;

      // If we don't have extracted text yet, extract from the file
      if (!contentToUse && file) {
        const fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const extractResponse = await supabase.functions.invoke('extract-document-text', {
          body: { fileData, fileName: file.name, fileType: file.type }
        });

        if (extractResponse.error) throw new Error(extractResponse.error.message || 'Failed to extract text');

        contentToUse = extractResponse.data?.text;
        if (!contentToUse || contentToUse.trim().length === 0) {
          throw new Error('Could not extract text from document');
        }

        setExtractedText(contentToUse);
        onContentExtracted?.(contentToUse, file.name);
      }

      if (!contentToUse) {
        throw new Error('No document content available');
      }

      setProcessingStage('analyzing');
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingStage('generating');

      const questionsResponse = await supabase.functions.invoke('generate-pdf-questions', {
        body: {
          course_name: courseName || displayFileName.replace(/\.[^/.]+$/, ''),
          course_code: courseCode || 'N/A',
          course_title: courseTitle || 'Uploaded Document',
          pdf_content: contentToUse,
          difficulty,
          question_type: questionType
        }
      });

      if (questionsResponse.error) throw new Error(questionsResponse.error.message || 'Failed to generate questions');

      if (questionsResponse.data?.success) {
        setProcessingStage('complete');
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Questions generated successfully!');
        onQuestionsGenerated(questionsResponse.data);
      } else {
        throw new Error(questionsResponse.data?.error || 'Failed to generate questions');
      }
    } catch (err) {
      console.error('Processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process document';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <DocumentProcessingAnimation stage={processingStage} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Upload className="h-5 w-5 text-primary" />
          {existingContent ? 'Document Ready' : 'Upload Your Document'}
        </CardTitle>
        <CardDescription className="text-sm">
          {existingContent 
            ? 'Your document is loaded. Choose question type and generate!'
            : 'Share a document from WhatsApp, Telegram, or your file manager to generate questions'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        {/* Show existing document or upload area */}
        {existingContent ? (
          <div className="border-2 border-primary/30 rounded-lg p-6 text-center bg-primary/5">
            <div className="flex flex-col items-center gap-3">
              {getFileIcon()}
              <div>
                <p className="font-medium text-sm md:text-base">{displayFileName}</p>
                <p className="text-xs text-muted-foreground">Document loaded and ready</p>
              </div>
              {onUploadNew && (
                <Button variant="outline" size="sm" onClick={onUploadNew} className="mt-2">
                  <Upload className="h-3 w-3 mr-1" />
                  Upload New Document
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            } ${error ? 'border-destructive' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {getFileIcon()}
                <div className="text-center sm:text-left">
                  <p className="font-medium text-sm md:text-base break-all">{file.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile} className="flex-shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {getFileIcon()}
                <div>
                  <p className="font-medium text-sm md:text-base">Drag and drop your file here</p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    or click to browse (PDF, DOCX, PPTX, TXT)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.ppt,.pptx,.txt"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileInputChange}
                />
                <Button variant="outline" asChild size="sm" className="md:size-default">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Browse Files
                  </label>
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-xs md:text-sm">{error}</p>
          </div>
        )}

        {/* Question Type Selection - show when file is selected or content exists */}
        {hasDocument && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm md:text-base">What type of questions do you want?</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setQuestionType('mcq')}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  questionType === 'mcq' 
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
              >
                <BookOpen className={`h-6 w-6 mx-auto mb-2 ${questionType === 'mcq' ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="font-semibold text-sm">MCQ</p>
                <p className="text-xs text-muted-foreground mt-1">40 multiple choice</p>
              </button>
              <button
                type="button"
                onClick={() => setQuestionType('essay')}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  questionType === 'essay' 
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
              >
                <PenTool className={`h-6 w-6 mx-auto mb-2 ${questionType === 'essay' ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="font-semibold text-sm">Essay</p>
                <p className="text-xs text-muted-foreground mt-1">10 essay questions</p>
              </button>
            </div>
          </div>
        )}

        {/* Course Details (Optional) */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm md:text-base">Course Details (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseName" className="text-sm">Course Name</Label>
              <Input id="courseName" placeholder="e.g., Introduction to Programming" value={courseName} onChange={(e) => setCourseName(e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseCode" className="text-sm">Course Code</Label>
              <Input id="courseCode" placeholder="e.g., CSC101" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseTitle" className="text-sm">Course Title</Label>
              <Input id="courseTitle" placeholder="e.g., Computer Science 101" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-sm">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button onClick={handleGenerate} className="w-full" size="lg" disabled={!hasDocument || !questionType || isProcessing}>
          <FileText className="h-4 w-4 mr-2" />
          Generate {questionType === 'mcq' ? '40 MCQ' : questionType === 'essay' ? '10 Essay' : 'Test'} Questions
        </Button>
      </CardContent>
    </Card>
  );
};

export default StudentDocumentUpload;
