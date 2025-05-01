
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useComments = (tutorialId: string) => {
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
      console.log("Submitting comment:", {
        tutorial_id: tutorialId,
        user_id: user.id,
        content,
        parent_id: replyingTo
      });

      const { data, error } = await supabase
        .from('tutorial_comments')
        .insert([
          {
            tutorial_id: tutorialId,
            user_id: user.id,
            content,
            parent_id: replyingTo
          }
        ])
        .select();

      if (error) {
        console.error("Error posting comment:", error);
        // Don't throw the error here, handle it gracefully
        toast({
          title: "Error posting comment",
          description: error.message || "An unexpected error occurred",
          variant: "destructive"
        });
        // Still proceed with fetching comments to ensure UI is updated with latest data
        await fetchComments();
        return;
      }

      console.log("Comment posted successfully:", data);
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully",
      });
      
      setReplyingTo(null);
      await fetchComments();
    } catch (err: any) {
      console.error("Error posting comment:", err);
      toast({
        title: "Error posting comment",
        description: err.message || "An unexpected error occurred",
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

  const handleDeleteComment = async (commentId: string) => {
    // After deletion on the backend, update the UI by filtering out the deleted comment
    setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    
    // Also remove any replies to this comment
    setComments(prevComments => prevComments.filter(comment => comment.parent_id !== commentId));
  };

  // Function to organize comments into a hierarchical structure
  const organizeComments = () => {
    // Group comments by parent/child
    const parentComments = comments.filter(comment => !comment.parent_id);
    const childComments = comments.filter(comment => comment.parent_id);
    
    // Get child comments by parent ID
    const getChildComments = (parentId: string) => {
      return childComments.filter(comment => comment.parent_id === parentId);
    };
    
    return { parentComments, getChildComments };
  };

  return {
    comments,
    isLoading,
    isSubmitting,
    replyingTo,
    setReplyingTo,
    handleSubmitComment,
    handleReply,
    handleDeleteComment,
    organizeComments,
    fetchComments
  };
};
