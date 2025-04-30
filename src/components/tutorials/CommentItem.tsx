
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Reply, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    parent_id: string | null;
    reactions: { likes: number; hearts: number };
    profiles?: {
      display_name?: string;
      avatar_url?: string;
      email?: string;
    };
  };
  onReply: (parentId: string) => void;
  onReactionUpdate: () => void;
  onDelete: (commentId: string) => void;
}

const CommentItem = ({ comment, onReply, onReactionUpdate, onDelete }: CommentItemProps) => {
  const { user } = useAuth();
  const [isReacting, setIsReacting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isCommentOwner = user && user.id === comment.user_id;

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
        .from('tutorial_comment_reactions')
        .select('*')
        .eq('comment_id', comment.id)
        .eq('user_id', user.id)
        .eq('reaction_type', 'heart')
        .maybeSingle();

      if (existingReaction) {
        await supabase
          .from('tutorial_comment_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        await supabase
          .from('tutorial_comment_reactions')
          .insert({
            comment_id: comment.id,
            user_id: user.id,
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

  const handleDelete = async () => {
    try {
      await supabase
        .from('tutorial_comments')
        .delete()
        .eq('id', comment.id);
      
      onDelete(comment.id);
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="flex gap-4 p-4 bg-card rounded-lg">
        <Avatar className="h-10 w-10">
          <img 
            src={comment.profiles?.avatar_url || "https://api.dicebear.com/7.x/avatars/svg"} 
            alt="avatar"
            className="h-full w-full object-cover rounded-full"
          />
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium">
              {comment.profiles?.display_name || comment.profiles?.email || 'Anonymous'}
            </p>
            <span className="text-sm text-muted-foreground">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-sm">{comment.content}</p>
          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-8 px-2 hover:text-primary"
              onClick={() => onReply(comment.id)}
            >
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-muted-foreground h-8 px-2 hover:text-red-500 ${isReacting ? 'opacity-50' : ''}`}
              onClick={handleReaction}
              disabled={isReacting}
            >
              <Heart className="h-4 w-4 mr-1" />
              {comment.reactions?.hearts || 0}
            </Button>
            {isCommentOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-8 px-2 hover:text-red-500"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your comment and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CommentItem;
