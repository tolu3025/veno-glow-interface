
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reply } from 'lucide-react';
import { BlogComment } from '@/types/blog';

interface CommentItemProps {
  comment: BlogComment;
  onReply: (commentId: string) => void;
  onReactionUpdate: () => void;
  children?: React.ReactNode;
}

export const CommentItem = ({ 
  comment, 
  onReply,
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-8 px-2"
                onClick={() => onReply(comment.id)}
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
            </div>
          </div>
        </div>
      </Card>
      {children}
    </div>
  );
};
