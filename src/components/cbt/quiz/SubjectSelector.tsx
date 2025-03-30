
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Subject } from '@/hooks/useSubjects';

interface SubjectSelectorProps {
  subjects: Subject[] | undefined;
  subject: string;
  onSubjectChange: (value: string) => void;
  isLoading: boolean;
  isRetrying: boolean;
  connectionStatus: 'unknown' | 'connected' | 'disconnected';
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  subjects,
  subject,
  onSubjectChange,
  isLoading,
  isRetrying,
  connectionStatus
}) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="subject">Pick Subject</Label>
      
      <Select value={subject} onValueChange={onSubjectChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a subject" />
        </SelectTrigger>
        <SelectContent>
          {isLoading || isRetrying ? (
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
      
      {subjects && subjects.length > 0 && connectionStatus !== 'connected' && (
        <p className="text-xs text-muted-foreground">
          {connectionStatus === 'disconnected' ? 
            'Showing cached subjects. Some may be unavailable offline.' : 
            'Showing available subjects.'}
        </p>
      )}
    </div>
  );
};

export default SubjectSelector;
