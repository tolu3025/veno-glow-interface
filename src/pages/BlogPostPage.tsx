
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/AuthProvider";
import { CommentForm } from "@/components/blog/CommentForm";
import { CommentList } from "@/components/blog/CommentList";
import { ArrowLeft } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

// Define types that match what comes from Supabase
interface BlogCommentFromDB {
  id: string;
  content: string;
  created_at: string;
  user_email: string;
  parent_id: string | null;
  blog_post_id: string;
  reactions: {
    likes: number;
    hearts: number;
    dislikes: number;
  } | null;
  updated_at: string;
}

// Define the type expected by our CommentList component
interface BlogComment {
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

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  author_name: string | null;
  created_at: string;
  category: string;
  published: boolean;
}

const BlogPostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const [replyTo, setReplyTo] = React.useState<string | null>(null);

  // Fetch blog post
  const { data: post, isLoading: isLoadingPost, error: postError } = useQuery({
    queryKey: ['blog-post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .eq('published', true)
        .single();
      
      if (error) throw error;
      return data as BlogPost;
    },
  });

  // Fetch comments for this blog post
  const { 
    data: commentsData, 
    isLoading: isLoadingComments, 
    error: commentsError,
    refetch: refetchComments 
  } = useQuery({
    queryKey: ['blog-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('blog_post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Transform the data to ensure the reactions field has the expected structure
      const transformedData: BlogComment[] = (data as BlogCommentFromDB[]).map(comment => ({
        ...comment,
        reactions: comment.reactions || { likes: 0, hearts: 0, dislikes: 0 }
      }));
      
      return transformedData;
    },
  });

  const handleSubmitComment = async (content: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post a comment",
        variant: "warning",
      });
      return;
    }

    try {
      const { error } = await supabase.from('blog_comments').insert({
        blog_post_id: postId,
        content,
        user_email: user.email,
        parent_id: replyTo,
        reactions: { likes: 0, hearts: 0, dislikes: 0 }
      });

      if (error) throw error;
      
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully",
        variant: "default",
      });
      
      setReplyTo(null);
      refetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post your comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle loading states
  if (isLoadingPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-6 w-32 bg-muted mb-4 rounded animate-pulse" />
          <div className="h-12 w-full bg-muted mb-4 rounded animate-pulse" />
          <div className="h-64 w-full bg-muted mb-6 rounded animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-6 w-full bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (postError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Oops!</h1>
        <p className="text-muted-foreground mb-8">We couldn't find the blog post you're looking for.</p>
        <Button asChild>
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Link>
        </Button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Blog Post Not Found</h1>
        <p className="text-muted-foreground mb-8">The post you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Posts
        </Link>
      </Button>

      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {post.category}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          {post.author_name && (
            <p className="text-muted-foreground">By {post.author_name}</p>
          )}
        </header>

        {post.image_url && (
          <img 
            src={post.image_url} 
            alt={post.title}
            className="w-full h-auto max-h-[400px] object-cover rounded-lg mb-8"
          />
        )}

        <div className="prose prose-slate dark:prose-invert max-w-none">
          {/* Render content - in a real app you might want to use a markdown renderer */}
          <p className="text-lg leading-relaxed mb-6">{post.content}</p>
        </div>

        <Separator className="my-12" />

        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Comments</h2>
          
          {user ? (
            <div className="mb-8">
              <CommentForm onSubmit={handleSubmitComment} parentId={replyTo} />
              {replyTo && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setReplyTo(null)}
                  className="mt-2"
                >
                  Cancel Reply
                </Button>
              )}
            </div>
          ) : (
            <Card className="p-4 mb-8 bg-muted/50">
              <p className="text-center">
                <Link to="/auth" className="text-primary font-medium hover:underline">
                  Sign in
                </Link> to leave a comment
              </p>
            </Card>
          )}
          
          {isLoadingComments ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-muted mb-2 rounded" />
                      <div className="h-4 w-full bg-muted rounded" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : commentsError ? (
            <p className="text-center text-muted-foreground">
              Failed to load comments. Please try again later.
            </p>
          ) : commentsData && commentsData.length > 0 ? (
            <CommentList 
              comments={commentsData} 
              onReply={(commentId) => setReplyTo(commentId)} 
              onReactionUpdate={refetchComments}
            />
          ) : (
            <p className="text-center text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </section>
      </article>
    </div>
  );
};

export default BlogPostPage;
