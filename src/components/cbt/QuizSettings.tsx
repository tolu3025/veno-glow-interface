import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VenoLogo } from '@/components/ui/logo';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Clock, BrainCircuit, Hourglass, Database, Users } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuizSettingsProps {
  subject: string;
  onStartQuiz: (settings: QuizSettings) => void;
  onBack: () => void;
}

export interface QuizSettings {
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all';
  timeLimit: number; // in minutes
  questionsCount: number;
  questionSource: 'question_bank' | 'user_tests' | 'mixed';
}

const QuizSettings: React.FC<QuizSettingsProps> = ({ subject, onStartQuiz, onBack }) => {
  const { data: subjects, isLoading: subjectsLoading, error: subjectsError } = useSubjects();
  const [userTestsCount, setUserTestsCount] = useState(0);
  const [loadingUserTests, setLoadingUserTests] = useState(true);
  
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: 'all',
    timeLimit: 15,
    questionsCount: 10,
    questionSource: 'mixed',
  });

  // Get question counts with flexible subject matching
  const currentSubject = subjects?.find(s => 
    s.name.toLowerCase().includes(subject.toLowerCase()) || 
    subject.toLowerCase().includes(s.name.toLowerCase())
  );
  const questionBankCount = currentSubject?.question_count || 0;

  useEffect(() => {
    fetchUserTestsCount();
  }, [subject]);

  const fetchUserTestsCount = async () => {
    try {
      // Get questions from test_questions table for the specific subject using flexible matching
      const { data, error } = await supabase
        .from('test_questions')
        .select('id, subject')
        .not('subject', 'is', null);

      if (error) throw error;
      
      // Count questions that match the subject (case-insensitive partial match)
      const matchingQuestions = data?.filter(q => 
        q.subject && (
          q.subject.toLowerCase().includes(subject.toLowerCase()) ||
          subject.toLowerCase().includes(q.subject.toLowerCase())
        )
      ) || [];
      
      setUserTestsCount(matchingQuestions.length);
    } catch (error) {
      console.error('Error fetching user tests count:', error);
      setUserTestsCount(0);
    } finally {
      setLoadingUserTests(false);
    }
  };

  const getTotalAvailableQuestions = () => {
    switch (settings.questionSource) {
      case 'question_bank':
        return questionBankCount;
      case 'user_tests':
        return userTestsCount;
      case 'mixed':
        return questionBankCount + userTestsCount;
      default:
        return 0;
    }
  };

  const availableQuestions = getTotalAvailableQuestions();

  const handleDifficultyChange = (value: string) => {
    setSettings({
      ...settings,
      difficulty: value as 'beginner' | 'intermediate' | 'advanced' | 'all',
    });
  };

  const handleTimeLimitChange = (value: number[]) => {
    setSettings({
      ...settings,
      timeLimit: value[0],
    });
  };

  const handleQuestionsCountChange = (value: number[]) => {
    // Ensure we set the exact number requested, not +1
    setSettings({
      ...settings,
      questionsCount: value[0],
    });
  };

  const handleQuestionSourceChange = (value: string) => {
    const newSource = value as 'question_bank' | 'user_tests' | 'mixed';
    setSettings({
      ...settings,
      questionSource: newSource,
      questionsCount: Math.min(settings.questionsCount, getTotalAvailableQuestions())
    });
  };

  const handleStartQuiz = () => {
    if (availableQuestions === 0) {
      toast.error('No questions available for the selected criteria');
      return;
    }

    if (settings.questionsCount > availableQuestions) {
      toast.error(`Only ${availableQuestions} questions available. Please reduce the question count.`);
      return;
    }

    onStartQuiz(settings);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Enhanced Quiz Settings</CardTitle>
        </div>
        <CardDescription>Configure your {subject} quiz from multiple question sources</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Source Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-veno-primary" />
            <h3 className="text-lg font-medium">Question Source</h3>
          </div>
          <Select value={settings.questionSource} onValueChange={handleQuestionSourceChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mixed">
                Mixed Sources ({questionBankCount + userTestsCount} total)
              </SelectItem>
              <SelectItem value="question_bank">
                Question Bank Only ({questionBankCount} available)
              </SelectItem>
              <SelectItem value="user_tests">
                User Created Tests ({userTestsCount} available)
              </SelectItem>
            </SelectContent>
          </Select>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
              <Database className="h-4 w-4 text-blue-600" />
              <span>Question Bank: {questionBankCount}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <Users className="h-4 w-4 text-green-600" />
              <span>User Tests: {userTestsCount}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
              <Badge variant="outline">Total: {availableQuestions}</Badge>
            </div>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-veno-primary" />
            <h3 className="text-lg font-medium">Difficulty Level</h3>
          </div>
          <RadioGroup
            defaultValue={settings.difficulty}
            onValueChange={handleDifficultyChange}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="beginner" id="beginner" />
              <Label htmlFor="beginner" className="cursor-pointer">Beginner</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="intermediate" id="intermediate" />
              <Label htmlFor="intermediate" className="cursor-pointer">Intermediate</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="advanced" id="advanced" />
              <Label htmlFor="advanced" className="cursor-pointer">Advanced</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer">All Levels</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Time Limit */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-veno-primary" />
            <h3 className="text-lg font-medium">Time Limit</h3>
          </div>
          <div className="space-y-4">
            <Slider
              defaultValue={[settings.timeLimit]}
              max={60}
              min={5}
              step={5}
              onValueChange={handleTimeLimitChange}
              className="w-full"
            />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">5 min</span>
              <span className="text-sm font-medium">{settings.timeLimit} minutes</span>
              <span className="text-sm text-muted-foreground">60 min</span>
            </div>
          </div>
        </div>

        {/* Number of Questions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-veno-primary" />
            <h3 className="text-lg font-medium">Number of Questions</h3>
            <Badge variant={availableQuestions > 0 ? "default" : "destructive"}>
              {availableQuestions} available
            </Badge>
          </div>
          <div className="space-y-4">
            <Slider
              defaultValue={[settings.questionsCount]}
              max={Math.min(50, availableQuestions)}
              min={1}
              step={1}
              onValueChange={handleQuestionsCountChange}
              className="w-full"
              disabled={availableQuestions === 0}
            />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">1</span>
              <span className="text-sm font-medium">{settings.questionsCount} questions</span>
              <span className="text-sm text-muted-foreground">{Math.min(50, availableQuestions)}</span>
            </div>
          </div>
        </div>

        {/* Warning for insufficient questions */}
        {availableQuestions === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              No questions available for "{subject}". Please select a different subject or create questions first.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          className="bg-veno-primary hover:bg-veno-primary/90" 
          onClick={handleStartQuiz}
          disabled={availableQuestions === 0 || settings.questionsCount > availableQuestions}
        >
          Start Quiz ({Math.min(settings.questionsCount, availableQuestions)} questions)
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizSettings;