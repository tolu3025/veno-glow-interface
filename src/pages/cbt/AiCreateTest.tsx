
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
import { Wand2 } from 'lucide-react';

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
  const [resultsVisibility, setResultsVisibility] = useState('after_completion');
  
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

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    if (value !== 'custom') {
      setCustomSubject('');
    }
  };

  const handleGenerateTest = async () => {
    if (!user) {
      toast.error('Please log in to create tests');
      return;
    }

    const finalSubject = subject === 'custom' ? customSubject : subject;
    
    if (!finalSubject) {
      toast.error('Please select or enter a subject');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Generating AI test:', {
        subject: finalSubject,
        topic,
        difficulty,
        count: questionCount
      });
      
      // Call the generate-ai-questions function
      const { data, error } = await supabase.functions.invoke('generate-ai-questions', {
        body: {
          subject: finalSubject,
          topic: topic || undefined,
          difficulty,
          count: questionCount
        }
      });
      
      if (error) throw error;
      
      if (!data?.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions were generated');
      }
      
      // Create a new test
      const { data: testData, error: testError } = await supabase
        .from('user_tests')
        .insert({
          title: `${finalSubject} ${topic ? '- ' + topic : ''} Test`,
          description: instructions || `AI-generated test on ${finalSubject}${topic ? ' about ' + topic : ''}.`,
          subject: finalSubject,
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
        subject: finalSubject
      }));
      
      const { error: questionError } = await supabase
        .from('user_test_questions')
        .insert(questionsToInsert);
        
      if (questionError) throw questionError;
      
      toast.success('Test created successfully!');
      navigate(`/cbt/manage/${testData.id}`);
      
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test. Please try again.');
    } finally {
      setLoading(false);
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
            Generate a complete test using AI based on your specifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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
              max={30}
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
              max={120}
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
                  <SelectItem value="after_completion">Show after completion</SelectItem>
                  <SelectItem value="creator_only">Creator only</SelectItem>
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
            disabled={loading || (!subject && !customSubject)}
            className="w-full"
          >
            {loading ? 'Generating Test...' : 'Generate Test'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiCreateTest;
