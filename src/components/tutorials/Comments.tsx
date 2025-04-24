
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  tutorial_id: string;
  user_id: string;
  profiles?: {
    display_name?: string;
    avatar_url?: string;
    email?: string;
  };
  user_email?: string; // Fallback for older data
}

interface CommentsProps {
  tutorialId: string;
}

const Comments = ({ tutorialId }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!tutorialId) {
      console.error("No tutorial ID provided to Comments component");
      setIsFetching(false);
      return;
    }
    
    fetchComments();
    const subscription = subscribeToComments();
    
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [tutorialId]);

  const fetchComments = async () => {
    try {
      console.log("Fetching comments for tutorial:", tutorialId);
      setIsFetching(true);
      
      // Using a simpler query that avoids the problematic join
      const { data, error } = await supabase
        .from('tutorial_comments')
        .select('*')
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

      console.log("Comments loaded:", data?.length || 0);
      
      // Get user information separately to avoid the join issue
      if (data && data.length > 0) {
        const commentsWithUserInfo = await Promise.all(
          data.map(async (comment) => {
            if (comment.user_id) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('display_name, avatar_url, email')
                .eq('id', comment.user_id)
                .maybeSingle();
                
              return {
                ...comment,
                profiles: profileData || {
                  display_name: 'Unknown User',
                  avatar_url: undefined,
                  email: undefined
                }
              };
            }
            return comment;
          })
        );
        
        setComments(commentsWithUserInfo as Comment[]);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("Unexpected error loading comments:", err);
      toast({
        title: "Error loading comments",
        description: "An unexpected error occurred while loading comments",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel('tutorial_comments_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tutorial_comments',
        filter: `tutorial_id=eq.${tutorialId}`
      }, () => {
        console.log("Comment change detected, refreshing comments");
        fetchComments();
      })
      .subscribe();

    return channel;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment",
        variant: "destructive"
      });
      return;
    }

    if (!tutorialId) {
      toast({
        title: "Error posting comment",
        description: "Tutorial ID is missing",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Submitting comment for tutorial:", tutorialId, "by user:", user.id);
      const { data, error } = await supabase
        .from('tutorial_comments')
        .insert([
          {
            tutorial_id: tutorialId,
            user_id: user.id,
            content: newComment.trim()
          }
        ]);

      if (error) {
        console.error("Error posting comment:", error);
        toast({
          title: "Error posting comment",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log("Comment posted successfully:", data);
      setNewComment('');
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully",
      });
      
      // Refresh comments
      fetchComments();
    } catch (err) {
      console.error("Unexpected error posting comment:", err);
      toast({
        title: "Error posting comment",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "Add a comment..." : "Please sign in to comment"}
          disabled={!user || isLoading}
          className="min-h-[100px]"
        />
        <Button 
          type="submit" 
          disabled={!user || isLoading || !newComment.trim()}
        >
          {isLoading ? "Posting..." : "Post Comment"}
        </Button>
      </form>

      <div className="space-y-4 mt-6">
        {isFetching ? (
          <p className="text-center py-4">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 bg-card rounded-lg">
              <Avatar className="h-10 w-10">
                <img 
                  src={comment.profiles?.avatar_url || "https://api.dicebear.com/7.x/avatars/svg"} 
                  alt="avatar" 
                />
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {comment.profiles?.display_name || comment.profiles?.email || comment.user_email || 'Anonymous'}
                  </p>
                  <span className="text-sm text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
