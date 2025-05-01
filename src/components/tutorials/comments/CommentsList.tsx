
import { useState } from 'react';
import CommentItem from '../CommentItem';
import CommentForm from '../CommentForm';
import { Button } from '@/components/ui/button';

interface CommentsListProps {
  comments: any[];
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  handleSubmitComment: (content: string) => Promise<void>;
  handleReply: (parentId: string) => void;
  isSubmitting: boolean;
  handleDeleteComment: (commentId: string) => Promise<void>;
  getChildComments: (parentId: string) => any[];
}

const CommentsList = ({
  comments,
  replyingTo,
  setReplyingTo,
  handleSubmitComment,
  handleReply,
  isSubmitting,
  handleDeleteComment,
  getChildComments
}: CommentsListProps) => {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="space-y-4">
          <CommentItem 
            comment={comment}
            onReply={handleReply}
            onReactionUpdate={() => {/* This will be passed from parent */}}
            onDelete={handleDeleteComment}
          />
          
          {replyingTo === comment.id && (
            <div className="ml-12 mt-2">
              <CommentForm 
                onSubmit={handleSubmitComment}
                parentId={comment.id}
                isSubmitting={isSubmitting}
              />
              <div className="mt-2 text-right">
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel reply
                </Button>
              </div>
            </div>
          )}
          
          {/* Display replies to this comment */}
          <div className="ml-12 space-y-4">
            {getChildComments(comment.id).map(reply => (
              <div key={reply.id}>
                <CommentItem 
                  comment={reply}
                  onReply={handleReply}
                  onReactionUpdate={() => {/* This will be passed from parent */}}
                  onDelete={handleDeleteComment}
                />
                
                {replyingTo === reply.id && (
                  <div className="ml-12 mt-2">
                    <CommentForm 
                      onSubmit={handleSubmitComment}
                      parentId={reply.id}
                      isSubmitting={isSubmitting}
                    />
                    <div className="mt-2 text-right">
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="text-sm text-muted-foreground hover:text-primary"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentsList;
