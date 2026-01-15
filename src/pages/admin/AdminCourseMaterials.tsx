import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, FileText, School, BookOpen, Loader2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

const AdminCourseMaterials = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

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

  const handleUpload = async () => {
    if (!file || !courseName || !courseCode || !courseTitle) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileName = `course-materials/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Extract text from document
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
        body: {
          fileData,
          fileName: file.name,
          fileType: file.type
        }
      });

      const extractedText = extractResponse.data?.text || '';

      // Save to database
      const { error: dbError } = await supabase
        .from('course_materials')
        .insert({
          course_name: courseName,
          course_code: courseCode,
          course_title: courseTitle,
          file_url: urlData.publicUrl,
          file_content: extractedText,
          institution: institution || null,
          department: department || null,
          uploaded_by: user?.id
        });

      if (dbError) throw dbError;

      toast.success('Course material uploaded successfully!');
      setUploadDialogOpen(false);
      resetForm();
      fetchMaterials();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload course material');
    } finally {
      setIsUploading(false);
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

  const resetForm = () => {
    setCourseName('');
    setCourseCode('');
    setCourseTitle('');
    setInstitution('');
    setDepartment('');
    setFile(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course Materials</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage class PDFs for question generation
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Course Material</DialogTitle>
              <DialogDescription>
                Upload a class PDF with course details for question generation
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course Title *</Label>
                  <Input
                    id="courseTitle"
                    placeholder="e.g., CS 101"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    placeholder="e.g., Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">PDF File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.doc,.ppt,.pptx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button
                onClick={handleUpload}
                className="w-full"
                disabled={isUploading || !file || !courseName || !courseCode || !courseTitle}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Materials</CardDescription>
            <CardTitle className="text-3xl">{materials.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Institutions</CardDescription>
            <CardTitle className="text-3xl">
              {new Set(materials.filter(m => m.institution).map(m => m.institution)).size}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Departments</CardDescription>
            <CardTitle className="text-3xl">
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
            Manage uploaded course materials and PDFs
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{material.course_name}</h3>
                      <Badge variant="secondary">{material.course_code}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{material.course_title}</span>
                      </div>
                      {material.institution && (
                        <div className="flex items-center gap-1">
                          <School className="h-4 w-4" />
                          <span>{material.institution}</span>
                        </div>
                      )}
                      {material.department && (
                        <span>{material.department}</span>
                      )}
                      <span className="text-xs">
                        {new Date(material.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(material.file_url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
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
