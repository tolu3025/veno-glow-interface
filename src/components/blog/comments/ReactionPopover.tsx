
import React from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Smile } from 'lucide-react';

export const EMOJI_OPTIONS = [
  { emoji: "❤️", key: "heart" },
  { emoji: "👍", key: "thumbsup" },
  { emoji: "👎", key: "thumbsdown" },
  { emoji: "😄", key: "smile" },
  { emoji: "😮", key: "wow" },
  { emoji: "😢", key: "sad" },
  { emoji: "😡", key: "angry" }
];

interface ReactionPopoverProps {
  onReaction: (emojiKey: string) => Promise<void>;
  isReacting: boolean;
  openPopover: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReactionPopover = ({ 
  onReaction, 
  isReacting, 
  openPopover, 
  onOpenChange 
}: ReactionPopoverProps) => {
  return (
    <Popover open={openPopover} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`text-muted-foreground h-8 px-2 ${isReacting ? 'opacity-50' : ''}`}
          disabled={isReacting}
        >
          <Smile className="h-4 w-4 mr-1" />
          React
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-2">
        <div className="flex gap-2">
          {EMOJI_OPTIONS.map(({ emoji, key }) => (
            <button
              key={key}
              className="text-xl hover:scale-125 transition-transform p-1"
              onClick={() => onReaction(key)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
