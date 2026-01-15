import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X, File, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import DocumentProcessingAnimation from './DocumentProcessingAnimation';

interface StudentDocumentUploadProps {
  onQuestionsGenerated: (questions: any) => void;
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

const StudentDocumentUpload: React.FC<StudentDocumentUploadProps> = ({ onQuestionsGenerated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'extracting' | 'analyzing' | 'generating' | 'complete'>('extracting');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="h-8 w-8 text-muted-foreground" />;
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'pptx':
      case 'ppt':
        return <FileText className="h-8 w-8 text-orange-500" />;
      default:
        return <File className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      toast.error('Please upload a document first');
      return;
    }

    setIsProcessing(true);
    setProcessingStage('extracting');
    setError(null);

    try {
      // Read file as base64
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

      // Extract text from document
      const extractResponse = await supabase.functions.invoke('extract-document-text', {
        body: {
          fileData,
          fileName: file.name,
          fileType: file.type
        }
      });

      if (extractResponse.error) {
        throw new Error(extractResponse.error.message || 'Failed to extract text');
      }

      const extractedText = extractResponse.data?.text;
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Could not extract text from document');
      }

      setProcessingStage('analyzing');

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      setProcessingStage('generating');

      // Generate questions from extracted text
      const questionsResponse = await supabase.functions.invoke('generate-pdf-questions', {
        body: {
          course_name: courseName || file.name.replace(/\.[^/.]+$/, ''),
          course_code: courseCode || 'N/A',
          course_title: courseTitle || 'Uploaded Document',
          pdf_content: extractedText,
          difficulty
        }
      });

      if (questionsResponse.error) {
        throw new Error(questionsResponse.error.message || 'Failed to generate questions');
      }

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
          Upload Your Document
        </CardTitle>
        <CardDescription className="text-sm">
          Share a document from WhatsApp, Telegram, or your file manager to generate questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        {/* File Upload Area */}
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

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-xs md:text-sm">{error}</p>
          </div>
        )}

        {/* Course Details (Optional) */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm md:text-base">Course Details (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseName" className="text-sm">Course Name</Label>
              <Input
                id="courseName"
                placeholder="e.g., Introduction to Programming"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseCode" className="text-sm">Course Code</Label>
              <Input
                id="courseCode"
                placeholder="e.g., CSC101"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseTitle" className="text-sm">Course Title</Label>
              <Input
                id="courseTitle"
                placeholder="e.g., Computer Science 101"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-sm">Difficulty Level</Label>
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
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          className="w-full"
          size="lg"
          disabled={!file || isProcessing}
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate Test Questions
        </Button>
      </CardContent>
    </Card>
  );
};

export default StudentDocumentUpload;
