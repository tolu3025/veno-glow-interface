
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Reply, Smile } from 'lucide-react';
import { BlogComment, BlogCommentReactions } from '@/types/blog';

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

interface CommentItemProps {
  comment: BlogComment;
  onReply: (commentId: string) => void;
  onReactionUpdate: () => void;
  children?: React.ReactNode;
}

const EMOJI_OPTIONS = [
  { emoji: "❤️", key: "heart" },
  { emoji: "👍", key: "thumbsup" },
  { emoji: "👎", key: "thumbsdown" },
  { emoji: "😄", key: "smile" },
  { emoji: "😮", key: "wow" },
  { emoji: "😢", key: "sad" },
  { emoji: "😡", key: "angry" }
];

const CommentItem = ({ comment, onReply, onReactionUpdate, children }: CommentItemProps) => {
  const [isReacting, setIsReacting] = React.useState(false);
  const [openPopover, setOpenPopover] = React.useState(false);

  const handleReaction = async (emojiKey: string) => {
    try {
      setIsReacting(true);
      
      const { data: commentData } = await supabase
        .from('blog_article_comments')
        .select('reactions')
        .eq('id', comment.id)
        .single();
        
      if (commentData) {
        const currentReactions = commentData.reactions as BlogCommentReactions || {};
        
        // Update the reaction count
        const updatedReactions = {
          ...currentReactions,
          [emojiKey]: (currentReactions[emojiKey] || 0) + 1
        };
        
        await supabase
          .from('blog_article_comments')
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
      setOpenPopover(false);
    }
  };

  const renderReactionCounts = () => {
    if (!comment.reactions) return null;
    
    return Object.entries(comment.reactions).map(([key, count]) => {
      const emojiOption = EMOJI_OPTIONS.find(e => e.key === key);
      if (emojiOption && count > 0) {
        return (
          <span key={key} className="inline-flex items-center gap-1 text-sm text-muted-foreground bg-muted/40 px-2 py-1 rounded-full">
            {emojiOption.emoji} {count}
          </span>
        );
      }
      return null;
    }).filter(Boolean);
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-8 px-2"
                onClick={() => onReply(comment.id)}
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
              
              <Popover open={openPopover} onOpenChange={setOpenPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-muted-foreground h-8 px-2 ${isReacting ? 'opacity-50' : ''}`}
                    disabled={isReacting}
                  >
                    <Smile className="h-4 w-4 mr-1" />
                    React
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-2">
                  <div className="flex gap-2">
                    {EMOJI_OPTIONS.map(({ emoji, key }) => (
                      <button
                        key={key}
                        className="text-xl hover:scale-125 transition-transform p-1"
                        onClick={() => handleReaction(key)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex gap-1 items-center ml-2">
                {renderReactionCounts()}
              </div>
            </div>
          </div>
        </div>
      </Card>
      {children}
    </div>
  );
};
