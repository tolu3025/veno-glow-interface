
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { Plus, Wand2 } from 'lucide-react';
import FeatureAccessGuard from '@/components/billing/FeatureAccessGuard';

// Define the allowed difficulty values as a union type
type TestDifficulty = "beginner" | "intermediate" | "advanced";

const CreateTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<TestDifficulty>('intermediate');
  const [timeLimit, setTimeLimit] = useState(30);
  const [allowRetakes, setAllowRetakes] = useState(true);
  const [resultsVisibility, setResultsVisibility] = useState('test_takers');

  const handleCreateTest = async () => {
    if (!user) {
      toast.error('Please log in to create tests');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a test title');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('user_tests')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          subject: subject.trim(),
          difficulty: difficulty as TestDifficulty,
          question_count: 0, // Will be updated as questions are added
          time_limit: timeLimit,
          results_visibility: resultsVisibility,
          allow_retakes: allowRetakes,
          creator_id: user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success('Test created successfully!');
      navigate(`/cbt/manage/${data.id}`);
      
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAICreateTest = () => {
    navigate('/cbt/ai-create');
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
            <p className="text-center text-muted-foreground mb-6">
              Please sign in to create and manage tests
            </p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="grid gap-6">
        {/* AI Create Test Option */}
        <FeatureAccessGuard featureType="ai_test">
          <Card className="border-2 border-dashed border-veno-primary/20 hover:border-veno-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Wand2 className="mr-2 h-5 w-5 text-veno-primary" />
                Create Test with AI
              </CardTitle>
              <CardDescription>
                Generate a complete test automatically using AI based on your specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleAICreateTest}
                className="w-full bg-veno-primary hover:bg-veno-primary/90"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Create Test with AI
              </Button>
            </CardContent>
          </Card>
        </FeatureAccessGuard>

        {/* Manual Test Creation */}
        <FeatureAccessGuard featureType="manual_test">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Create Test Manually
              </CardTitle>
              <CardDescription>
                Create a test from scratch and add your own questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="title">Test Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter test title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter test description (optional)"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject (e.g., Mathematics, Physics)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Difficulty Level</Label>
                <Select 
                  value={difficulty} 
                  onValueChange={(value: TestDifficulty) => setDifficulty(value)}
                >
                  <SelectTrigger className="mt-1">
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

              <Button 
                onClick={handleCreateTest}
                disabled={loading || !title.trim() || !subject.trim()}
                className="w-full"
              >
                {loading ? 'Creating Test...' : 'Create Test'}
              </Button>
            </CardContent>
          </Card>
        </FeatureAccessGuard>
      </div>
    </div>
  );
};

export default CreateTest;
