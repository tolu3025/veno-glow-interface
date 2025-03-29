
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Clock, BrainCircuit, Hourglass } from 'lucide-react';

interface QuizSettingsProps {
  subject: string;
  onStartQuiz: (settings: QuizSettings) => void;
  onBack: () => void;
}

export interface QuizSettings {
  difficulty: 'easy' | 'medium' | 'hard' | 'all';
  timeLimit: number; // in minutes
  questionsCount: number;
}

const QuizSettings: React.FC<QuizSettingsProps> = ({ subject, onStartQuiz, onBack }) => {
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: 'all',
    timeLimit: 15,
    questionsCount: 10,
  });

  const handleDifficultyChange = (value: string) => {
    setSettings({
      ...settings,
      difficulty: value as 'easy' | 'medium' | 'hard' | 'all',
    });
  };

  const handleTimeLimitChange = (value: number[]) => {
    setSettings({
      ...settings,
      timeLimit: value[0],
    });
  };

  const handleQuestionsCountChange = (value: number[]) => {
    setSettings({
      ...settings,
      questionsCount: value[0],
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Quiz Settings</CardTitle>
        </div>
        <CardDescription>Configure your {subject} quiz</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
              <RadioGroupItem value="easy" id="easy" />
              <Label htmlFor="easy" className="cursor-pointer">Easy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hard" id="hard" />
              <Label htmlFor="hard" className="cursor-pointer">Hard</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer">All Levels</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-veno-primary" />
            <h3 className="text-lg font-medium">Time Limit</h3>
          </div>
          <div className="space-y-4">
            <Slider
              defaultValue={[settings.timeLimit]}
              max={30}
              min={5}
              step={5}
              onValueChange={handleTimeLimitChange}
              className="w-full"
            />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">5 min</span>
              <span className="text-sm font-medium">{settings.timeLimit} minutes</span>
              <span className="text-sm text-muted-foreground">30 min</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-veno-primary" />
            <h3 className="text-lg font-medium">Number of Questions</h3>
          </div>
          <div className="space-y-4">
            <Slider
              defaultValue={[settings.questionsCount]}
              max={20}
              min={5}
              step={5}
              onValueChange={handleQuestionsCountChange}
              className="w-full"
            />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">5</span>
              <span className="text-sm font-medium">{settings.questionsCount} questions</span>
              <span className="text-sm text-muted-foreground">20</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          className="bg-veno-primary hover:bg-veno-primary/90" 
          onClick={() => onStartQuiz(settings)}
        >
          Start Quiz
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizSettings;
