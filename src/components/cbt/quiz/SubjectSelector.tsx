
import React, { useState, useMemo } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2, BookOpen, Brain, Combine } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Subject } from '@/hooks/useSubjects';
import { cn } from '@/lib/utils';

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
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Filter subjects based on search value
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    if (!searchValue) return subjects;
    
    return subjects.filter(subj =>
      subj.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [subjects, searchValue]);

  const selectedSubject = subjects?.find(subj => subj.name === subject);

  const getSourceIcon = (source: Subject['source']) => {
    switch (source) {
      case 'admin':
        return <BookOpen className="h-3 w-3 text-blue-600" />;
      case 'ai-generated':
        return <Brain className="h-3 w-3 text-purple-600" />;
      case 'combined':
        return <Combine className="h-3 w-3 text-green-600" />;
      default:
        return <BookOpen className="h-3 w-3" />;
    }
  };

  const getSourceLabel = (source: Subject['source']) => {
    switch (source) {
      case 'admin':
        return 'Admin Questions';
      case 'ai-generated':
        return 'AI Generated';
      case 'combined':
        return 'Mixed Sources';
      default:
        return 'Questions';
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="subject" className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-veno-primary" />
        Pick Subject from Available Questions
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading || isRetrying}
          >
            {selectedSubject ? (
              <div className="flex items-center gap-2">
                {getSourceIcon(selectedSubject.source)}
                <span className="font-medium">{selectedSubject.name}</span>
                <span className="text-sm text-muted-foreground">
                  ({selectedSubject.question_count} questions from {getSourceLabel(selectedSubject.source)})
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select a subject from available questions...</span>
            )}
            {isLoading || isRetrying ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search subjects..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading || isRetrying ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-veno-primary mr-2" />
                    <span>Loading subjects from all sources...</span>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No subjects found.</p>
                    <p className="text-xs mt-1">Ask an admin to create questions or generate tests with AI.</p>
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredSubjects.map((subj) => (
                  <CommandItem
                    key={subj.name}
                    value={subj.name}
                    onSelect={(currentValue) => {
                      onSubjectChange(currentValue === subject ? "" : currentValue);
                      setOpen(false);
                      setSearchValue("");
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          subject === subj.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2">
                        {getSourceIcon(subj.source)}
                        <span className="font-medium">{subj.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>{subj.question_count}</span>
                      <span className="text-xs">({getSourceLabel(subj.source)})</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Status information */}
      <div className="text-xs text-muted-foreground space-y-1">
        {subjects && subjects.length > 0 ? (
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <span>Showing {subjects.length} subject{subjects.length !== 1 ? 's' : ''} from all sources</span>
          </div>
        ) : null}
        
        {connectionStatus !== 'connected' && (
          <p className="text-amber-600">
            {connectionStatus === 'disconnected' ? 
              'Showing cached subjects. Some may be unavailable offline.' : 
              'Loading subjects from all available sources...'}
          </p>
        )}
      </div>
    </div>
  );
};

export default SubjectSelector;
