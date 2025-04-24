
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
      
      // First, fetch all comments for the tutorial
      const { data: commentsData, error: commentsError } = await supabase
        .from('tutorial_comments')
        .select('*')
        .eq('tutorial_id', tutorialId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error("Error fetching comments:", commentsError);
        toast({
          title: "Error loading comments",
          description: commentsError.message,
          variant: "destructive"
        });
        return;
      }

      // Get unique user IDs from comments
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      
      // If there are comments, fetch the profile data separately
      let commentsWithProfiles = commentsData;
      
      if (userIds.length > 0) {
        // Fetch profiles data
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        } else if (profiles) {
          // Create a map for quick profile lookup
          const profileMap = new Map();
          profiles.forEach(profile => {
            profileMap.set(profile.id, profile);
          });

          // Merge comments with profile data
          commentsWithProfiles = commentsData.map(comment => {
            const profile = profileMap.get(comment.user_id) || { 
              display_name: 'Anonymous',
              avatar_url: null,
              email: null
            };
            
            return {
              ...comment,
              profiles: profile
            };
          });
        }

        // Fetch reactions counts separately
        commentsWithProfiles = await Promise.all(
          commentsWithProfiles.map(async (comment) => {
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
      }

      setComments(commentsWithProfiles);
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
          comments
            .filter(comment => !comment.parent_id)
            .map((comment) => (
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
