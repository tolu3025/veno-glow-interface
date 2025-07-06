
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Upload, X, FileText, AlertCircle, BookOpen } from 'lucide-react';

type TestDifficulty = "beginner" | "intermediate" | "advanced";

interface DocumentBasedAiTestCreationProps {
  onGenerateTest: (params: {
    difficulty: TestDifficulty;
    questionCount: number;
    timeLimit: number;
    instructions: string;
    allowRetakes: boolean;
    resultsVisibility: string;
    uploadedFiles: File[];
  }) => void;
  loading: boolean;
  uploading: boolean;
}

const DocumentBasedAiTestCreation: React.FC<DocumentBasedAiTestCreationProps> = ({
  onGenerateTest,
  loading,
  uploading
}) => {
  const [difficulty, setDifficulty] = useState<TestDifficulty>('intermediate');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);
  const [instructions, setInstructions] = useState('');
  const [allowRetakes, setAllowRetakes] = useState(true);
  const [resultsVisibility, setResultsVisibility] = useState('test_takers');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const acceptedFileTypes = '.pdf,.docx,.ppt,.pptx';

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return ['pdf', 'docx', 'ppt', 'pptx'].includes(extension || '');
    });

    if (validFiles.length !== files.length) {
      toast.error('Only PDF, DOCX, PPT, and PPTX files are supported');
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) uploaded successfully`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    onGenerateTest({
      difficulty,
      questionCount,
      timeLimit,
      instructions,
      allowRetakes,
      resultsVisibility,
      uploadedFiles
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <BookOpen className="mr-2" /> Document-Based Test Creation
        </CardTitle>
        <CardDescription>
          Upload documents and let AI automatically extract subject and topics to generate relevant questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* File Upload Section */}
        <div className="space-y-3">
          <Label>Upload Documents</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Drop files here or click to upload
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PDF, DOCX, PPT, PPTX up to 10MB each
                  </span>
                </label>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only" 
                  multiple 
                  accept={acceptedFileTypes} 
                  onChange={handleFileUpload} 
                  disabled={uploading} 
                />
              </div>
            </div>
          </div>
          
          {/* Display uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files:</Label>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-cyan-800">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-zinc-950">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFile(index)} 
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {/* Auto mode indicator */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Auto-generation enabled</p>
                  <p className="text-blue-600">AI will automatically extract subject and topics from your uploaded documents.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <Label>Difficulty</Label>
          <Select value={difficulty} onValueChange={(value: TestDifficulty) => setDifficulty(value)}>
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
        
        <div>
          <div className="flex justify-between">
            <Label>Number of Questions: {questionCount}</Label>
          </div>
          <Slider 
            value={[questionCount]} 
            min={5} 
            max={70} 
            step={1} 
            onValueChange={value => setQuestionCount(value[0])} 
            className="mt-2" 
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <Label>Time Limit: {timeLimit} minutes</Label>
          </div>
          <Slider 
            value={[timeLimit]} 
            min={10} 
            max={180} 
            step={5} 
            onValueChange={value => setTimeLimit(value[0])} 
            className="mt-2" 
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Retakes</Label>
              <p className="text-sm text-muted-foreground">
                Allow participants to take the test multiple times
              </p>
            </div>
            <Switch checked={allowRetakes} onCheckedChange={setAllowRetakes} />
          </div>

          <div>
            <Label>Results Visibility</Label>
            <Select value={resultsVisibility} onValueChange={setResultsVisibility}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creator_only">Creators Only</SelectItem>
                <SelectItem value="test_takers">Users can see their results</SelectItem>
                <SelectItem value="public">Public leaderboard</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Control who can see test results
            </p>
          </div>
        </div>
        
        <div>
          <Label>Test Instructions (Optional)</Label>
          <Textarea 
            value={instructions} 
            onChange={e => setInstructions(e.target.value)} 
            placeholder="Enter any specific instructions for test takers" 
            rows={3} 
          />
        </div>
        
        <Button 
          onClick={handleGenerate} 
          disabled={loading || uploading || uploadedFiles.length === 0} 
          className="w-full"
        >
          {loading ? 'Generating Test...' : uploading ? 'Uploading Files...' : 'Generate Test from Documents'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentBasedAiTestCreation;
