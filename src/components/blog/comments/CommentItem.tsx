
import React from 'react';
import { Card } from "@/components/ui/card";
import { BlogComment } from '@/types/blog';

interface CommentItemProps {
  comment: BlogComment;
  onReactionUpdate: () => void;
  children?: React.ReactNode;
}

export const CommentItem = ({ 
  comment, 
  children 
}: CommentItemProps) => {
  return (
    <div className="space-y-2">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            {comment.user_email[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
              <p className="font-medium truncate">{comment.user_email}</p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(comment.created_at).toLocaleDateString()}
              </p>
            </div>
            <p className="mt-1 text-sm break-words">{comment.content}</p>
          </div>
        </div>
      </Card>
      {children}
    </div>
  );
};
