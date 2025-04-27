
import React from 'react';
import { BlogCommentReactions } from '@/types/blog';
import { EMOJI_OPTIONS } from './ReactionPopover';

interface ReactionDisplayProps {
  reactions: BlogCommentReactions;
}

export const ReactionDisplay = ({ reactions }: ReactionDisplayProps) => {
  if (!reactions) return null;
  
  const reactionEntries = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort(([_, countA], [__, countB]) => countB - countA);
  
  if (reactionEntries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactionEntries.map(([key, count]) => {
        const emojiOption = EMOJI_OPTIONS.find(e => e.key === key);
        if (emojiOption) {
          return (
            <div 
              key={key}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 border border-border shadow-sm"
            >
              <span className="text-sm">{emojiOption.emoji}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};
