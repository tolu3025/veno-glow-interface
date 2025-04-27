
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EditQuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  question: {
    id: string;
    question: string;
    options: string[];
    answer: number;
    explanation?: string;
  } | null;
  onSave: (updatedQuestion: {
    id: string;
    question: string;
    options: string[];
    answer: number;
    explanation?: string;
  }) => Promise<void>;
}

export const EditQuestionDialog = ({
  isOpen,
  onClose,
  question,
  onSave,
}: EditQuestionDialogProps) => {
  const [editedQuestion, setEditedQuestion] = React.useState(question);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setEditedQuestion(question);
  }, [question]);

  if (!editedQuestion) return null;

  const handleSave = async () => {
    if (!editedQuestion) return;
    setIsSaving(true);
    try {
      await onSave(editedQuestion);
      onClose();
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateOption = (index: number, value: string) => {
    setEditedQuestion(prev => {
      if (!prev) return prev;
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Question Text</label>
            <Textarea
              value={editedQuestion.question}
              onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, question: e.target.value } : prev)}
              placeholder="Enter question text"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Options</label>
            {editedQuestion.options.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                />
                <input
                  type="radio"
                  checked={editedQuestion.answer === index}
                  onChange={() => setEditedQuestion(prev => prev ? { ...prev, answer: index } : prev)}
                  className="h-4 w-4"
                />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Explanation (Optional)</label>
            <Textarea
              value={editedQuestion.explanation || ''}
              onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, explanation: e.target.value } : prev)}
              placeholder="Enter explanation"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
