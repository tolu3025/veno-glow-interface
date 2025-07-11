
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { LucideIcon } from 'lucide-react';

interface SliderControlProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  icon?: React.ReactNode;
  unit?: string;
  disabled?: boolean;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  onValueChange,
  min,
  max,
  step,
  icon,
  unit = '',
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <Label className={disabled ? "text-muted-foreground" : ""}>{label}: {value} {unit}</Label>
      </div>
      <div className="space-y-4">
        <Slider
          value={[value]}
          max={max}
          min={min}
          step={step}
          onValueChange={(values) => onValueChange(values[0])}
          className="w-full"
          disabled={disabled}
        />
        <div className="flex justify-between">
          <span className={`text-sm ${disabled ? "text-muted-foreground/50" : "text-muted-foreground"}`}>{min} {unit}</span>
          <span className={`text-sm font-medium ${disabled ? "text-muted-foreground" : ""}`}>{value} {unit}</span>
          <span className={`text-sm ${disabled ? "text-muted-foreground/50" : "text-muted-foreground"}`}>{max} {unit}</span>
        </div>
      </div>
    </div>
  );
};

export default SliderControl;
