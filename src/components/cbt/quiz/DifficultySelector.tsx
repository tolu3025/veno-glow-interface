
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface DifficultySelectorProps {
  difficulty: string;
  onDifficultyChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  difficulty,
  onDifficultyChange,
  options
}) => {
  return (
    <div className="space-y-3">
      <Label>Difficulty Level</Label>
      <RadioGroup
        value={difficulty}
        onValueChange={onDifficultyChange}
        className="grid grid-cols-2 gap-4"
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={option.value} />
            <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default DifficultySelector;
