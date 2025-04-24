
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

interface CommentsProps {
  tutorialId: string;
}

const Comments = ({ tutorialId }: CommentsProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchComments = async () => {
    try {
      console.log("Fetching comments for tutorial:", tutorialId);
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('tutorial_comments')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            email
          )
        `)
        .eq('tutorial_id', tutorialId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        toast({
          title: "Error loading comments",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      const commentsWithReactions = await Promise.all(
        data.map(async (comment) => {
          const { data: reactions } = await supabase
            .from('tutorial_comment_reactions')
            .select('reaction_type')
            .eq('comment_id', comment.id);

          return {
            ...comment,
            reactions: {
              hearts: reactions?.filter(r => r.reaction_type === 'heart').length || 0,
              likes: reactions?.filter(r => r.reaction_type === 'like').length || 0
            }
          };
        })
      );

      setComments(commentsWithReactions);
    } catch (err) {
      console.error("Unexpected error loading comments:", err);
      toast({
        title: "Error loading comments",
        description: "An unexpected error occurred while loading comments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tutorialId) {
      fetchComments();
    }
  }, [tutorialId]);

  const handleSubmitComment = async (content: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('tutorial_comments')
        .insert([
          {
            tutorial_id: tutorialId,
            user_id: user.id,
            content,
            parent_id: replyingTo
          }
        ]);

      if (error) throw error;

      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully",
      });
      
      setReplyingTo(null);
      await fetchComments();
    } catch (err) {
      console.error("Error posting comment:", err);
      toast({
        title: "Error posting comment",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (parentId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to reply",
        variant: "destructive"
      });
      return;
    }
    setReplyingTo(parentId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      
      {!replyingTo && (
        <CommentForm 
          onSubmit={handleSubmitComment}
          isSubmitting={isSubmitting}
        />
      )}
      
      <div className="space-y-4 mt-6">
        {isLoading ? (
          <p className="text-center py-4">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <CommentItem 
                comment={comment}
                onReply={handleReply}
                onReactionUpdate={fetchComments}
              />
              {replyingTo === comment.id && (
                <div className="ml-12">
                  <CommentForm 
                    onSubmit={handleSubmitComment}
                    parentId={comment.id}
                    isSubmitting={isSubmitting}
                  />
                </div>
              )}
              {comments
                .filter(reply => reply.parent_id === comment.id)
                .map(reply => (
                  <div key={reply.id} className="ml-12">
                    <CommentItem 
                      comment={reply}
                      onReply={handleReply}
                      onReactionUpdate={fetchComments}
                    />
                  </div>
                ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
