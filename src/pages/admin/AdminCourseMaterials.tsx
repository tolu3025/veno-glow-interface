import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, FileText, School, BookOpen, Loader2, Download, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

interface CourseMaterial {
  id: string;
  course_name: string;
  course_code: string;
  course_title: string;
  file_url: string;
  institution: string | null;
  department: string | null;
  created_at: string;
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const AdminCourseMaterials = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form state
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials((data as CourseMaterial[]) || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load course materials');
    } finally {
      setIsLoading(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return `Unsupported file type: ${file.type}. Please upload PDF, DOCX, PPTX, or TXT files.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 15MB.`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setUploadError(null);
    
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        setUploadError(error);
        toast.error(error);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !courseName || !courseCode || !courseTitle) {
      toast.error('Please fill in all required fields');
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      toast.error(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      setUploadStage('Preparing file...');
      setUploadProgress(10);

      // Create a unique file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `course-materials/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      setUploadStage('Uploading to storage...');
      setUploadProgress(20);

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      setUploadProgress(40);
      setUploadStage('Getting file URL...');

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      setUploadProgress(50);
      setUploadStage('Extracting text from document...');

      // Read file as base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      setUploadProgress(60);

      // Extract text from document
      const extractResponse = await supabase.functions.invoke('extract-document-text', {
        body: {
          fileData,
          fileName: file.name,
          fileType: file.type
        }
      });

      if (extractResponse.error) {
        console.warn('Text extraction warning:', extractResponse.error);
      }

      const extractedText = extractResponse.data?.text || '';
      
      setUploadProgress(80);
      setUploadStage('Saving to database...');

      // Save to database
      const { error: dbError } = await supabase
        .from('course_materials')
        .insert({
          course_name: courseName,
          course_code: courseCode.toUpperCase(),
          course_title: courseTitle,
          file_url: urlData.publicUrl,
          file_content: extractedText.substring(0, 50000), // Limit stored text
          institution: institution || null,
          department: department || null,
          uploaded_by: user?.id
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database save failed: ${dbError.message}`);
      }

      setUploadProgress(100);
      setUploadStage('Complete!');

      toast.success('Course material uploaded successfully!');
      setUploadDialogOpen(false);
      resetForm();
      fetchMaterials();

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload course material';
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');

      // Delete from storage
      await supabase.storage.from('documents').remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Course material deleted');
      fetchMaterials();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete course material');
    }
  };

  const getFileExtension = (url: string): string => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    return ext.split('?')[0]; // Remove query params
  };

  const getFileTypeLabel = (url: string): string => {
    const ext = getFileExtension(url);
    switch (ext) {
      case 'pdf': return 'PDF';
      case 'docx': case 'doc': return 'Word';
      case 'pptx': case 'ppt': return 'PowerPoint';
      case 'txt': return 'Text';
      default: return 'Document';
    }
  };

  const resetForm = () => {
    setCourseName('');
    setCourseCode('');
    setCourseTitle('');
    setInstitution('');
    setDepartment('');
    setFile(null);
    setUploadError(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Course Materials</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Upload and manage class documents for question generation
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Course Material</DialogTitle>
              <DialogDescription>
                Upload PDF, Word (DOCX, DOC), PowerPoint (PPTX, PPT), or Text files
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="courseName">Course Name *</Label>
                <Input
                  id="courseName"
                  placeholder="e.g., Introduction to Programming"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  disabled={isUploading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Course Code *</Label>
                  <Input
                    id="courseCode"
                    placeholder="e.g., CSC101"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course Title *</Label>
                  <Input
                    id="courseTitle"
                    placeholder="e.g., CS 101"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    placeholder="e.g., University of Lagos"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    placeholder="e.g., Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Document File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.doc,.ppt,.pptx,.txt"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  Supported: PDF, Word (DOCX, DOC), PowerPoint (PPTX, PPT), Text (TXT) - Max 15MB
                </p>
                {file && (
                  <p className="text-xs text-green-600">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {uploadError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{uploadError}</p>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{uploadStage}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <Button
                onClick={handleUpload}
                className="w-full"
                disabled={isUploading || !file || !courseName || !courseCode || !courseTitle}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadStage || 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Material
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Materials</CardDescription>
            <CardTitle className="text-2xl md:text-3xl">{materials.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Institutions</CardDescription>
            <CardTitle className="text-2xl md:text-3xl">
              {new Set(materials.filter(m => m.institution).map(m => m.institution)).size}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Departments</CardDescription>
            <CardTitle className="text-2xl md:text-3xl">
              {new Set(materials.filter(m => m.department).map(m => m.department)).size}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle>All Course Materials</CardTitle>
          <CardDescription>
            Manage uploaded course materials and documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <h3 className="text-lg font-medium mb-2">No course materials yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first course material to get started
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Material
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate">{material.course_name}</h3>
                      <Badge variant="secondary">{material.course_code}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {getFileTypeLabel(material.file_url)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{material.course_title}</span>
                      </div>
                      {material.institution && (
                        <div className="flex items-center gap-1">
                          <School className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{material.institution}</span>
                        </div>
                      )}
                      {material.department && (
                        <span className="truncate">{material.department}</span>
                      )}
                      <span className="text-xs">
                        {new Date(material.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(material.file_url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Download</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Course Material</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{material.course_name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(material.id, material.file_url)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCourseMaterials;
