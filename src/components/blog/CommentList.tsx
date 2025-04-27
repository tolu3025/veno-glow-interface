
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
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
  // Organize comments into parent/child structure
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
  const { user } = useAuth();
  const [isReacting, setIsReacting] = React.useState(false);

  const handleReaction = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to react to comments",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsReacting(true);
      const { data: existingReaction } = await supabase
        .from('blog_comment_reactions')
        .select('*')
        .eq('comment_id', comment.id)
        .eq('user_email', user.email)
        .eq('reaction_type', 'heart')
        .maybeSingle();

      if (existingReaction) {
        await supabase
          .from('blog_comment_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        await supabase
          .from('blog_comment_reactions')
          .insert({
            comment_id: comment.id,
            user_email: user.email,
            reaction_type: 'heart'
          });
      }
      onReactionUpdate();
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
