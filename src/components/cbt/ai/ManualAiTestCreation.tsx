
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Wand2 } from 'lucide-react';

type TestDifficulty = "beginner" | "intermediate" | "advanced";

interface ManualAiTestCreationProps {
  onGenerateTest: (params: {
    subject: string;
    topic?: string;
    difficulty: TestDifficulty;
    questionCount: number;
    timeLimit: number;
    instructions: string;
    allowRetakes: boolean;
    resultsVisibility: string;
  }) => void;
  loading: boolean;
}

const ManualAiTestCreation: React.FC<ManualAiTestCreationProps> = ({
  onGenerateTest,
  loading
}) => {
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<TestDifficulty>('intermediate');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);
  const [instructions, setInstructions] = useState('');
  const [allowRetakes, setAllowRetakes] = useState(true);
  const [resultsVisibility, setResultsVisibility] = useState('test_takers');

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "History", "Geography", "Literature", "custom"];

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    if (value !== 'custom') {
      setCustomSubject('');
    }
  };

  const handleGenerate = () => {
    const finalSubject = subject === 'custom' ? customSubject : subject;
    onGenerateTest({
      subject: finalSubject,
      topic: topic || undefined,
      difficulty,
      questionCount,
      timeLimit,
      instructions,
      allowRetakes,
      resultsVisibility
    });
  };

  const isValid = subject === 'custom' ? customSubject.trim() : subject;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Wand2 className="mr-2" /> Manual Test Creation
        </CardTitle>
        <CardDescription>
          Create a test by specifying the subject and topic manually. AI will generate questions based on your specifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Subject</Label>
          <Select value={subject} onValueChange={handleSubjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subj => (
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
                onChange={e => setCustomSubject(e.target.value)} 
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
            onChange={e => setTopic(e.target.value)} 
            placeholder="E.g., Quadratic Equations, Cell Biology" 
          />
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
          disabled={loading || !isValid} 
          className="w-full"
        >
          {loading ? 'Generating Test...' : 'Generate Test'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ManualAiTestCreation;
