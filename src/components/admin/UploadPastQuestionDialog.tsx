import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';

interface UploadPastQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const UploadPastQuestionDialog = ({ open, onOpenChange, onSuccess }: UploadPastQuestionDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    school: '',
    year: '',
    subject: '',
    exam_type: '100-level' as '100-level' | '200-level' | '300-level' | '400-level' | '500-level' | '600-level' | 'post-utme' | 'waec' | 'jamb' | 'neco' | 'other'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!formData.title || !formData.school || !formData.year || !formData.subject) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `past-questions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded successfully to:', filePath);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Insert metadata into database (admin check handled by RLS)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user?.id) {
        console.error('User authentication error:', userError);
        throw new Error('User not authenticated. Please log in again.');
      }

      console.log('Authenticated user ID:', userData.user.id);
      
      const { error: insertError } = await supabase
        .from('past_questions')
        .insert({
          title: formData.title,
          school: formData.school,
          year: formData.year,
          subject: formData.subject,
          exam_type: formData.exam_type,
          file_url: publicUrl,
          file_size: file.size,
          uploaded_by: userData.user.id
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        
        // Provide specific error messages
        if (insertError.code === '42501') {
          throw new Error('Permission denied. You must be an admin to upload past questions.');
        } else if (insertError.code === '23505') {
          throw new Error('A past question with this information already exists.');
        } else {
          throw new Error(`Database error: ${insertError.message}`);
        }
      }

      console.log('Past question inserted successfully');

      toast.success('Past question uploaded successfully!');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFile(null);
      setFormData({
        title: '',
        school: '',
        year: '',
        subject: '',
        exam_type: '100-level'
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Show specific error message
      const errorMessage = error.message || 'Failed to upload past question. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Past Question</DialogTitle>
          <DialogDescription>
            Upload a PDF file and provide details about the past question
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">PDF File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {file && (
                <span className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Biology Post-UTME 2023"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={uploading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="school">School/Institution *</Label>
              <Input
                id="school"
                placeholder="e.g., University of Lagos"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                disabled={uploading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                placeholder="e.g., 2023"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                disabled={uploading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="e.g., Biology"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                disabled={uploading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam_type">Exam Type *</Label>
              <Select
                value={formData.exam_type}
                onValueChange={(value) => setFormData({ ...formData, exam_type: value as any })}
                disabled={uploading}
              >
                <SelectTrigger id="exam_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100-level">100 Level</SelectItem>
                  <SelectItem value="200-level">200 Level</SelectItem>
                  <SelectItem value="300-level">300 Level</SelectItem>
                  <SelectItem value="400-level">400 Level</SelectItem>
                  <SelectItem value="500-level">500 Level</SelectItem>
                  <SelectItem value="600-level">600 Level</SelectItem>
                  <SelectItem value="post-utme">POST-UTME</SelectItem>
                  <SelectItem value="jamb">JAMB</SelectItem>
                  <SelectItem value="waec">WAEC</SelectItem>
                  <SelectItem value="neco">NECO</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !file}>
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadPastQuestionDialog;
