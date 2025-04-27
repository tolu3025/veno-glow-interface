import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Reply, Heart } from 'lucide-react';

interface CommentProps {
  id: string;
  content: string;
  created_at: string;
  user_email: string;
  parent_id: string | null;
  reactions: {
    likes: number;
    hearts: number;
    dislikes: number;
  };
}

interface CommentListProps {
  comments: CommentProps[];
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

interface CommentItemProps {
  comment: CommentProps;
  onReply: (commentId: string) => void;
  onReactionUpdate: () => void;
  children?: React.ReactNode;
}

const CommentItem = ({ comment, onReply, onReactionUpdate, children }: CommentItemProps) => {
  const [isReacting, setIsReacting] = React.useState(false);

  const handleReaction = async () => {
    try {
      setIsReacting(true);
      
      const { data: commentData } = await supabase
        .from('blog_comments')
        .select('reactions')
        .eq('id', comment.id)
        .single();
        
      if (commentData) {
        const currentReactions = commentData.reactions as { likes: number; hearts: number; dislikes: number } || { likes: 0, hearts: 0, dislikes: 0 };
        
        const updatedReactions = {
          ...currentReactions,
          hearts: (currentReactions.hearts || 0) + 1
        };
        
        await supabase
          .from('blog_comments')
          .update({ reactions: updatedReactions })
          .eq('id', comment.id);
          
        onReactionUpdate();
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive"
      });
    } finally {
      setIsReacting(false);
    }
  };

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
            <div className="mt-2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-8 px-2"
                onClick={() => onReply(comment.id)}
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`text-muted-foreground h-8 px-2 ${isReacting ? 'opacity-50' : ''}`}
                onClick={handleReaction}
                disabled={isReacting}
              >
                <Heart className="h-4 w-4 mr-1" />
                {comment.reactions?.hearts || 0}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      {children}
    </div>
  );
};
