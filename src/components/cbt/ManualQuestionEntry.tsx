import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Save, X } from 'lucide-react';

interface ManualQuestionEntryProps {
  testId: string;
  onQuestionAdded: () => void;
  onCancel?: () => void;
}

const ManualQuestionEntry: React.FC<ManualQuestionEntryProps> = ({
  testId,
  onQuestionAdded,
  onCancel
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [subject, setSubject] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      
      // Adjust correct answer if needed
      if (correctAnswer !== null) {
        if (correctAnswer === index) {
          setCorrectAnswer(null);
        } else if (correctAnswer > index) {
          setCorrectAnswer(correctAnswer - 1);
        }
      }
    }
  };

  const validateForm = () => {
    if (!question.trim()) {
      toast.error('Question is required');
      return false;
    }

    const filledOptions = options.filter(opt => opt.trim());
    if (filledOptions.length < 2) {
      toast.error('At least 2 options are required');
      return false;
    }

    if (correctAnswer === null) {
      toast.error('Please select the correct answer');
      return false;
    }

    if (!options[correctAnswer]?.trim()) {
      toast.error('Correct answer option cannot be empty');
      return false;
    }

    if (!subject.trim()) {
      toast.error('Subject is required');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Filter out empty options
      const validOptions = options.filter(opt => opt.trim());
      
      // Adjust correct answer index for filtered options
      let adjustedCorrectAnswer = correctAnswer!;
      const emptyOptionsBefore = options.slice(0, correctAnswer!).filter(opt => !opt.trim()).length;
      adjustedCorrectAnswer -= emptyOptionsBefore;

      const questionData = {
        test_id: testId,
        question: question.trim(),
        options: validOptions,
        answer: adjustedCorrectAnswer,
        explanation: explanation.trim() || null,
        difficulty,
        subject: subject.trim()
      };

      const { error } = await supabase
        .from('test_questions')
        .insert(questionData);

      if (error) throw error;

      // Update test question count
      const { data: currentTest } = await supabase
        .from('user_tests')
        .select('question_count')
        .eq('id', testId)
        .single();

      if (currentTest) {
        await supabase
          .from('user_tests')
          .update({ 
            question_count: (currentTest.question_count || 0) + 1 
          })
          .eq('id', testId);
      }

      toast.success('Question added successfully');
      
      // Reset form
      setQuestion('');
      setOptions(['', '', '', '']);
      setCorrectAnswer(null);
      setExplanation('');
      setSubject('');
      
      onQuestionAdded();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Add Question Manually
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="question">Question *</Label>
          <Textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question here..."
            rows={3}
            className="mt-1"
          />
        </div>

        <div className="space-y-3">
          <Label>Answer Options *</Label>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
              </div>
              <Button
                type="button"
                variant={correctAnswer === index ? "default" : "outline"}
                size="sm"
                onClick={() => setCorrectAnswer(correctAnswer === index ? null : index)}
                disabled={!option.trim()}
              >
                {correctAnswer === index ? "Correct" : "Mark Correct"}
              </Button>
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          {options.length < 6 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="w-full"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
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
        </div>

        <div>
          <Label htmlFor="explanation">Explanation (Optional)</Label>
          <Textarea
            id="explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explain why this answer is correct..."
            rows={2}
            className="mt-1"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Question
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualQuestionEntry;