
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { BookOpen, Clock } from 'lucide-react';
import { VenoLogo } from '@/components/ui/logo';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all', label: 'All Levels' }
];

const QuizSection = () => {
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [questionsCount, setQuestionsCount] = useState<number>(10);

  const handleStartQuiz = () => {
    if (!subject) {
      toast({
        title: "No subject entered",
        description: "Please enter a subject before starting the quiz",
        variant: "warning",
      });
      return;
    }

    navigate(`/cbt/take/subject`, { 
      state: { 
        subject: subject,
        settings: {
          difficulty,
          timeLimit,
          questionsCount
        }
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Quiz Setup</CardTitle>
        </div>
        <CardDescription>Configure your quiz settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subject Input */}
        <div className="space-y-3">
          <Label htmlFor="subject">Enter Subject</Label>
          <Input
            id="subject"
            placeholder="e.g. Mathematics, Science, History"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Difficulty Level */}
        <div className="space-y-3">
          <Label>Difficulty Level</Label>
          <RadioGroup
            value={difficulty}
            onValueChange={setDifficulty}
            className="grid grid-cols-2 gap-4"
          >
            {difficultyOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Time Limit */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-veno-primary" />
            <Label>Time Limit: {timeLimit} minutes</Label>
          </div>
          <div className="space-y-4">
            <Slider
              value={[timeLimit]}
              max={40}
              min={5}
              step={5}
              onValueChange={(value) => setTimeLimit(value[0])}
              className="w-full"
            />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">5 min</span>
              <span className="text-sm font-medium">{timeLimit} minutes</span>
              <span className="text-sm text-muted-foreground">40 min</span>
            </div>
          </div>
        </div>

        {/* Number of Questions */}
        <div className="space-y-3">
          <Label>Number of Questions: {questionsCount}</Label>
          <div className="space-y-4">
            <Slider
              value={[questionsCount]}
              max={40}
              min={5}
              step={5}
              onValueChange={(value) => setQuestionsCount(value[0])}
              className="w-full"
            />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">5</span>
              <span className="text-sm font-medium">{questionsCount} questions</span>
              <span className="text-sm text-muted-foreground">40</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-veno-primary hover:bg-veno-primary/90"
          onClick={handleStartQuiz}
          disabled={!subject}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Start Quiz
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizSection;
