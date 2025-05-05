
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
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {comment.user_email[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium">{comment.user_email}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
              </p>
            </div>
            <p className="mt-1 text-sm">{comment.content}</p>
          </div>
        </div>
      </Card>
      {children}
    </div>
  );
};
