
import React from 'react';
import { BlogComment } from '@/types/blog';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  comments: BlogComment[];
  onReply: (commentId: string) => void;
  onReactionUpdate: () => void;
}

export const CommentList = ({ comments, onReply, onReactionUpdate }: CommentListProps) => {
  const parentComments = comments.filter(comment => !comment.parent_id);
  const childComments = comments.filter(comment => comment.parent_id);

  const getChildComments = (parentId: string) => {
    return childComments.filter(comment => comment.parent_id === parentId);
  };

  return (
    <div className="space-y-6">
      {parentComments.map(comment => (
        <CommentItem 
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onReactionUpdate={onReactionUpdate}
        >
          <div className="ml-12 mt-4 space-y-4">
            {getChildComments(comment.id).map(reply => (
              <CommentItem 
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onReactionUpdate={onReactionUpdate}
              />
            ))}
          </div>
        </CommentItem>
      ))}
    </div>
  );
};
