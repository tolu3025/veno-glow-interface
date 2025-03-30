
import React, { useState, useEffect } from 'react';
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
import { BookOpen, Clock, Loader2 } from 'lucide-react';
import { VenoLogo } from '@/components/ui/logo';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSubjects } from '@/hooks/useSubjects';

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all', label: 'All Levels' }
];

const QuizSection = () => {
  const navigate = useNavigate();
  const { data: subjects, isLoading, error } = useSubjects();
  
  const [subject, setSubject] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [questionsCount, setQuestionsCount] = useState<number>(10);

  // Reset subject selection if subjects change
  useEffect(() => {
    if (subjects && subjects.length > 0 && !subject) {
      setSubject('');
    }
  }, [subjects]);

  // Show error toast if subjects loading fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading subjects",
        description: "Failed to load available subjects. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error]);

  const handleStartQuiz = () => {
    if (!subject) {
      toast({
        title: "No subject selected",
        description: "Please select a subject before starting the quiz",
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
        {/* Subject Selector */}
        <div className="space-y-3">
          <Label htmlFor="subject">Pick Subject</Label>
          
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-veno-primary mr-2" />
                  <span>Loading subjects...</span>
                </div>
              ) : subjects && subjects.length > 0 ? (
                subjects.map((subj) => (
                  <SelectItem key={subj.name} value={subj.name}>
                    {subj.name} ({subj.question_count} questions)
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No subjects available
                </div>
              )}
            </SelectContent>
          </Select>
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
          disabled={!subject || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <BookOpen className="mr-2 h-4 w-4" />
              Start Quiz
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizSection;
