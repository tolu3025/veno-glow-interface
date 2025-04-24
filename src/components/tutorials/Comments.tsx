
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
  user_id: string;
  profiles: {
    display_name?: string;
    avatar_url?: string;
    email?: string;
  };
}

interface CommentsProps {
  tutorialId: string;
}

const Comments = ({ tutorialId }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
    subscribeToComments();
  }, [tutorialId]);

  const fetchComments = async () => {
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
      toast({
        title: "Error loading comments",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setComments(data || []);
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel('tutorial_comments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tutorial_comments',
        filter: `tutorial_id=eq.${tutorialId}`
      }, fetchComments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    setIsLoading(true);
    const { error } = await supabase
      .from('tutorial_comments')
      .insert([
        {
          tutorial_id: tutorialId,
          user_id: user.id,
          content: newComment
        }
      ]);

    setIsLoading(false);
    if (error) {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setNewComment('');
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
          Post Comment
        </Button>
      </form>

      <div className="space-y-4 mt-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4 p-4 bg-card rounded-lg">
            <Avatar className="h-10 w-10">
              <img 
                src={comment.profiles.avatar_url || "https://api.dicebear.com/7.x/avatars/svg"} 
                alt="avatar" 
              />
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {comment.profiles.display_name || comment.profiles.email || 'Anonymous'}
                </p>
                <span className="text-sm text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-sm">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;
