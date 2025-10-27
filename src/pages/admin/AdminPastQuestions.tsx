import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, FileText, School, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import UploadPastQuestionDialog from '@/components/admin/UploadPastQuestionDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PastQuestion {
  id: string;
  title: string;
  school: string;
  year: string;
  subject: string;
  exam_type: string;
  file_url: string;
  file_size: number;
  created_at: string;
}

const AdminPastQuestions = () => {
  const [pastQuestions, setPastQuestions] = useState<PastQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    fetchPastQuestions();
  }, []);

  const fetchPastQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('past_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPastQuestions((data as any) || []);
    } catch (error) {
      console.error('Error fetching past questions:', error);
      toast.error('Failed to load past questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Get 'past-questions/filename'

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('past_questions')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast.success('Past question deleted successfully');
      fetchPastQuestions();
    } catch (error) {
      console.error('Error deleting past question:', error);
      toast.error('Failed to delete past question');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Loading past questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Past Questions</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage past questions for students
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Past Question
        </Button>
      </div>

      <UploadPastQuestionDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={fetchPastQuestions}
      />

      {/* Statistics Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Past Questions</CardDescription>
            <CardTitle className="text-3xl">{pastQuestions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Schools</CardDescription>
            <CardTitle className="text-3xl">
              {new Set(pastQuestions.map(q => q.school)).size}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Subjects</CardDescription>
            <CardTitle className="text-3xl">
              {new Set(pastQuestions.map(q => q.subject)).size}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Past Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Past Questions</CardTitle>
          <CardDescription>
            Manage uploaded past questions and PDFs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastQuestions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <h3 className="text-lg font-medium mb-2">No past questions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first past question to get started
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Past Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pastQuestions.map((question) => (
                <div
                  key={question.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{question.title}</h3>
                      <Badge variant="secondary">{question.exam_type.toUpperCase()}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <School className="h-4 w-4" />
                        <span>{question.school}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{question.subject}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{question.year}</span>
                      </div>
                      <span>
                        {(question.file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="text-xs">
                        {new Date(question.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Past Question</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{question.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(question.id, question.file_url)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPastQuestions;
