import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Wand2, Save } from 'lucide-react';
import { useOrgExam } from '@/hooks/useOrgExam';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const academicLevels = [
  { value: 'jss1', label: 'JSS 1 (Junior Secondary 1)' },
  { value: 'jss2', label: 'JSS 2 (Junior Secondary 2)' },
  { value: 'jss3', label: 'JSS 3 (Junior Secondary 3)' },
  { value: 'sss1', label: 'SSS 1 (Senior Secondary 1)' },
  { value: 'sss2', label: 'SSS 2 (Senior Secondary 2)' },
  { value: 'sss3', label: 'SSS 3 (Senior Secondary 3)' },
  { value: '100_level', label: '100 Level (University Year 1)' },
  { value: '200_level', label: '200 Level (University Year 2)' },
  { value: '300_level', label: '300 Level (University Year 3)' },
  { value: '400_level', label: '400 Level (University Year 4)' },
  { value: '500_level', label: '500 Level (University Year 5)' },
  { value: 'professional', label: 'Professional / Postgraduate' },
];

const curriculumTypes = [
  { value: 'waec', label: 'WAEC Standard' },
  { value: 'neco', label: 'NECO Standard' },
  { value: 'jamb', label: 'JAMB Standard' },
  { value: 'university', label: 'University Standard' },
  { value: 'custom', label: 'Custom / General' },
];

const difficulties = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

type AcademicLevel = 'jss1' | 'jss2' | 'jss3' | 'sss1' | 'sss2' | 'sss3' | '100_level' | '200_level' | '300_level' | '400_level' | '500_level' | 'professional';
type CurriculumType = 'waec' | 'neco' | 'jamb' | 'university' | 'custom';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export default function CreateOrgExam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createExam, saveQuestions, generateQuestions } = useOrgExam();
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    topic: '',
    academicLevel: '' as AcademicLevel | '',
    curriculumType: 'custom' as CurriculumType,
    questionCount: 20,
    timeLimit: 60,
    difficulty: 'intermediate' as Difficulty,
    description: '',
    instructions: '',
    shuffleQuestions: true,
    shuffleOptions: true,
    showResultsImmediately: true,
    allowLateEntry: false,
    maxViolations: 5,
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateAndCreate = async () => {
    if (!formData.title || !formData.subject || !formData.academicLevel) {
      toast.error('Please fill in required fields: Title, Subject, and Academic Level');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setGenerating(true);
    try {
      // Generate questions using AI
      const questions = await generateQuestions({
        subject: formData.subject,
        academicLevel: formData.academicLevel,
        curriculumType: formData.curriculumType,
        questionCount: formData.questionCount,
        difficulty: formData.difficulty,
        topic: formData.topic || undefined,
      });

      if (!questions || questions.length === 0) {
        toast.error('Failed to generate questions. Please try again.');
        return;
      }

      setLoading(true);

      // Create the exam
      const exam = await createExam({
        title: formData.title,
        subject: formData.subject,
        academic_level: formData.academicLevel,
        curriculum_type: formData.curriculumType,
        question_count: questions.length,
        time_limit: formData.timeLimit,
        difficulty: formData.difficulty,
        description: formData.description || null,
        instructions: formData.instructions || null,
        shuffle_questions: formData.shuffleQuestions,
        shuffle_options: formData.shuffleOptions,
        show_results_immediately: formData.showResultsImmediately,
        allow_late_entry: formData.allowLateEntry,
        max_violations: formData.maxViolations,
        status: 'draft',
      });

      if (!exam) {
        toast.error('Failed to create exam');
        return;
      }

      // Save the generated questions
      const saved = await saveQuestions(exam.id, questions.map((q, i) => ({
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        order_index: i,
      })));

      if (!saved) {
        toast.error('Exam created but failed to save questions');
        return;
      }

      toast.success(`Exam created with ${questions.length} AI-generated questions`);
      navigate(`/org-exam/manage/${exam.id}`);
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('An error occurred while creating the exam');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  // ProtectedRoute handles auth - no need to check here

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/org-exam')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Examination</h1>
            <p className="text-muted-foreground">
              Set up exam parameters and generate questions using AI
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the fundamental details of the examination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Mathematics Mid-Term Examination"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics, Physics, Biology"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic / Focus Area (Optional)</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Algebra, Cell Biology, Nigerian History"
                  value={formData.topic}
                  onChange={(e) => handleChange('topic', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the examination"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Settings</CardTitle>
              <CardDescription>
                Configure the academic level and curriculum alignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Academic Level *</Label>
                  <Select 
                    value={formData.academicLevel} 
                    onValueChange={(v) => handleChange('academicLevel', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic level" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Curriculum Standard</Label>
                  <Select 
                    value={formData.curriculumType} 
                    onValueChange={(v) => handleChange('curriculumType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select curriculum" />
                    </SelectTrigger>
                    <SelectContent>
                      {curriculumTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(v) => handleChange('difficulty', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionCount">Number of Questions</Label>
                  <Input
                    id="questionCount"
                    type="number"
                    min={5}
                    max={100}
                    value={formData.questionCount}
                    onChange={(e) => handleChange('questionCount', parseInt(e.target.value) || 20)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min={10}
                    max={240}
                    value={formData.timeLimit}
                    onChange={(e) => handleChange('timeLimit', parseInt(e.target.value) || 60)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exam Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Settings</CardTitle>
              <CardDescription>
                Configure security and display options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Shuffle Questions</Label>
                    <p className="text-sm text-muted-foreground">
                      Randomize question order for each student
                    </p>
                  </div>
                  <Switch
                    checked={formData.shuffleQuestions}
                    onCheckedChange={(v) => handleChange('shuffleQuestions', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Shuffle Options</Label>
                    <p className="text-sm text-muted-foreground">
                      Randomize answer option order
                    </p>
                  </div>
                  <Switch
                    checked={formData.shuffleOptions}
                    onCheckedChange={(v) => handleChange('shuffleOptions', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Show Results Immediately</Label>
                    <p className="text-sm text-muted-foreground">
                      Display score after submission
                    </p>
                  </div>
                  <Switch
                    checked={formData.showResultsImmediately}
                    onCheckedChange={(v) => handleChange('showResultsImmediately', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Allow Late Entry</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow students to join after start
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowLateEntry}
                    onCheckedChange={(v) => handleChange('allowLateEntry', v)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxViolations">Maximum Security Violations</Label>
                <Input
                  id="maxViolations"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.maxViolations}
                  onChange={(e) => handleChange('maxViolations', parseInt(e.target.value) || 5)}
                  className="max-w-[200px]"
                />
                <p className="text-sm text-muted-foreground">
                  Number of violations before automatic disqualification
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Exam Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Enter any specific instructions for students..."
                  value={formData.instructions}
                  onChange={(e) => handleChange('instructions', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/org-exam')}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateAndCreate}
              disabled={generating || loading}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Exam...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate & Create Exam
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
