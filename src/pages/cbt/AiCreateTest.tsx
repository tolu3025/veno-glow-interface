import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import FeatureAccessGuard from '@/components/billing/FeatureAccessGuard';

const AiCreateTest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);
  const [allowRetakes, setAllowRetakes] = useState(true);
  const [resultsVisibility, setResultsVisibility] = useState<'public' | 'private'>('public');
  const [instructions, setInstructions] = useState('');

  const handleGenerateTest = async () => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to create a test');
        navigate('/auth');
        return;
      }

      // Generate AI questions
      const { data: questionsData, error: aiError } = await supabase.functions.invoke('generate-ai-questions', {
        body: {
          subject,
          topic: topic || subject,
          difficulty,
          questionCount,
          instructions
        }
      });

      if (aiError) throw aiError;

      const questions = questionsData?.questions || [];
      
      if (questions.length === 0) {
        toast.error('Failed to generate questions. Please try again.');
        setLoading(false);
        return;
      }

      // Create the test
      const { data: testData, error: testError } = await supabase
        .from('user_tests')
        .insert({
          title,
          subject,
          creator_id: user.id,
          question_count: questions.length,
          difficulty,
          time_limit: timeLimit,
          allow_retakes: allowRetakes,
          results_visibility: resultsVisibility,
          description: `AI-generated test on ${topic || subject}`
        })
        .select()
        .single();

      if (testError) throw testError;

      // Insert questions
      const questionsToInsert = questions.map((q: any) => ({
        test_id: testData.id,
        question_text: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation || '',
        subject
      }));

      const { error: questionsError } = await supabase
        .from('user_test_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast.success(`Test created with ${questions.length} AI-generated questions!`);
      navigate(`/cbt/manage/${testData.id}`);
      
    } catch (error: any) {
      console.error('Error creating AI test:', error);
      toast.error(error.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/cbt')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              Create Test with AI
            </h1>
            <p className="text-muted-foreground text-sm">
              Let AI generate questions for your test
            </p>
          </div>
        </div>

        {/* Feature Access Guard for AI Test */}
        <FeatureAccessGuard featureType="ai_test">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>
                Configure your test settings and let AI generate questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Test Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Physics Midterm Exam"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Physics, Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic (Optional)</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Newton's Laws of Motion"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
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

              {/* Question Count */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Number of Questions</Label>
                  <span className="text-sm font-medium">{questionCount}</span>
                </div>
                <Slider
                  value={[questionCount]}
                  onValueChange={(v) => setQuestionCount(v[0])}
                  min={5}
                  max={50}
                  step={5}
                />
              </div>

              {/* Time Limit */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Time Limit (minutes)</Label>
                  <span className="text-sm font-medium">{timeLimit} min</span>
                </div>
                <Slider
                  value={[timeLimit]}
                  onValueChange={(v) => setTimeLimit(v[0])}
                  min={5}
                  max={180}
                  step={5}
                />
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Retakes</Label>
                    <p className="text-sm text-muted-foreground">
                      Let participants retake the test
                    </p>
                  </div>
                  <Switch
                    checked={allowRetakes}
                    onCheckedChange={setAllowRetakes}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Results</Label>
                    <p className="text-sm text-muted-foreground">
                      Show results on public leaderboard
                    </p>
                  </div>
                  <Switch
                    checked={resultsVisibility === 'public'}
                    onCheckedChange={(checked) => 
                      setResultsVisibility(checked ? 'public' : 'private')
                    }
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions">Additional Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Any specific requirements for the questions..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateTest}
                disabled={loading || !title.trim() || !subject.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Test with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </FeatureAccessGuard>
      </div>
    </div>
  );
};

export default AiCreateTest;
