
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { Wand2, Upload, X, FileText } from 'lucide-react';

// Define the allowed difficulty values as a union type
type TestDifficulty = "beginner" | "intermediate" | "advanced";

const AiCreateTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<TestDifficulty>('intermediate');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);
  const [instructions, setInstructions] = useState('');
  const [allowRetakes, setAllowRetakes] = useState(true);
  const [resultsVisibility, setResultsVisibility] = useState('test_takers');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const subjects = [
    "Mathematics", 
    "Physics", 
    "Chemistry", 
    "Biology", 
    "Computer Science", 
    "History", 
    "Geography", 
    "Literature",
    "custom"
  ];

  const acceptedFileTypes = '.pdf,.docx,.ppt,.pptx';

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    if (value !== 'custom') {
      setCustomSubject('');
    }
  };

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

  const uploadFilesToStorage = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileName = `${user?.id}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);
      
      if (error) throw error;
      return fileName;
    });

    return Promise.all(uploadPromises);
  };

  const handleGenerateTest = async () => {
    if (!user) {
      toast.error('Please log in to create tests');
      return;
    }

    const finalSubject = subject === 'custom' ? customSubject : subject;
    
    if (!finalSubject && uploadedFiles.length === 0) {
      toast.error('Please select a subject or upload files');
      return;
    }

    setLoading(true);
    
    try {
      let fileUrls: string[] = [];
      
      // Upload files to storage if any
      if (uploadedFiles.length > 0) {
        setUploading(true);
        fileUrls = await uploadFilesToStorage(uploadedFiles);
        setUploading(false);
      }

      console.log('Generating AI test:', {
        subject: finalSubject,
        topic,
        difficulty,
        count: questionCount,
        fileUrls
      });
      
      // Call the generate-ai-questions function with file support
      const { data, error } = await supabase.functions.invoke('generate-ai-questions', {
        body: {
          subject: finalSubject || 'General',
          topic: topic || undefined,
          difficulty,
          count: questionCount,
          fileUrls
        }
      });
      
      if (error) throw error;
      
      if (!data?.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions were generated');
      }
      
      // Create a new test
      const testTitle = uploadedFiles.length > 0 
        ? `AI Test from ${uploadedFiles.map(f => f.name).join(', ')}`
        : `${finalSubject} ${topic ? '- ' + topic : ''} Test`;

      const { data: testData, error: testError } = await supabase
        .from('user_tests')
        .insert({
          title: testTitle,
          description: instructions || `AI-generated test${uploadedFiles.length > 0 ? ' from uploaded documents' : ` on ${finalSubject}${topic ? ' about ' + topic : ''}`}.`,
          subject: finalSubject || 'General',
          difficulty: difficulty as TestDifficulty,
          question_count: data.questions.length,
          time_limit: timeLimit,
          results_visibility: resultsVisibility,
          allow_retakes: allowRetakes,
          creator_id: user.id
        })
        .select()
        .single();
        
      if (testError) throw testError;
      
      // Add questions to the test
      const questionsToInsert = data.questions.map((q: any) => ({
        test_id: testData.id,
        question_text: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        subject: finalSubject || 'General'
      }));
      
      const { error: questionError } = await supabase
        .from('user_test_questions')
        .insert(questionsToInsert);
        
      if (questionError) throw questionError;
      
      // Clean up uploaded files from state
      setUploadedFiles([]);
      
      toast.success('Test created successfully!');
      navigate(`/cbt/manage/${testData.id}`);
      
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Wand2 className="mr-2" /> Create Test with AI
          </CardTitle>
          <CardDescription>
            Generate a complete test using AI based on your specifications or uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* File Upload Section */}
          <div className="space-y-3">
            <Label>Upload Documents (Optional)</Label>
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
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500">
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
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={handleSubjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subj) => (
                  <SelectItem key={subj} value={subj}>
                    {subj === 'custom' ? 'Custom subject...' : subj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {subject === 'custom' && (
              <div className="pt-2">
                <Label>Custom Subject</Label>
                <Input 
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter custom subject"
                  className="mt-1"
                />
              </div>
            )}
          </div>
          
          <div>
            <Label>Topic (Optional)</Label>
            <Input 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g., Quadratic Equations, Cell Biology"
            />
          </div>
          
          <div>
            <Label>Difficulty</Label>
            <Select 
              value={difficulty} 
              onValueChange={(value: TestDifficulty) => setDifficulty(value)}
            >
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
              onValueChange={(value) => setQuestionCount(value[0])}
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
              onValueChange={(value) => setTimeLimit(value[0])}
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
              <Switch
                checked={allowRetakes}
                onCheckedChange={setAllowRetakes}
              />
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
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter any specific instructions for test takers"
              rows={3}
            />
          </div>
          
          <Button 
            onClick={handleGenerateTest}
            disabled={loading || uploading || (!subject && !customSubject && uploadedFiles.length === 0)}
            className="w-full"
          >
            {loading ? 'Generating Test...' : uploading ? 'Uploading Files...' : 'Generate Test'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiCreateTest;
