import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  parentId?: string | null;
}
export const CommentForm = ({
  onSubmit,
  parentId
}: CommentFormProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };
  return <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder={parentId ? "Write a reply..." : "Share your thoughts..."} className="min-h-[100px] w-full" />
      <Button type="submit" disabled={isSubmitting || !content.trim()} className="float-right my-[29px]">
        {isSubmitting ? "Posting..." : parentId ? "Post Reply" : "Post Comment"}
      </Button>
    </form>;
};