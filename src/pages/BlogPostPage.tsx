import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CommentForm } from "@/components/blog/CommentForm";
import { CommentList } from "@/components/blog/comments/CommentList";
import { ArrowLeft, Share2, Facebook, Twitter, Linkedin, MessageSquareShare } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import WaveBackground from '@/components/blog/WaveBackground';
import { motion } from 'framer-motion';
import AdPlacement from '@/components/ads/AdPlacement';
import { BlogArticle, BlogComment, BlogCommentReactions } from '@/types/blog';
import { useAuth } from "@/providers/AuthProvider";
import { appendToActivities } from '@/functions/appendToActivities';

const BlogPostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const [commentorEmail, setCommentorEmail] = React.useState('');
  const { user } = useAuth();

  const { data: article, isLoading: isLoadingPost, error: postError } = useQuery({
    queryKey: ['blog-article', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('id', postId)
        .eq('published', true)
        .single();
      
      if (error) throw error;
      return data as BlogArticle;
    },
  });

  const { 
    data: commentsData, 
    isLoading: isLoadingComments, 
    error: commentsError,
    refetch: refetchComments 
  } = useQuery({
    queryKey: ['blog-article-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_article_comments')
        .select('*')
        .eq('article_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Transform the JSON reactions to our expected type
      return (data || []).map(comment => {
        const reactions = comment.reactions as unknown as BlogCommentReactions || { likes: 0, hearts: 0, dislikes: 0 };
        return {
          ...comment,
          reactions: {
            likes: reactions.likes || 0,
            hearts: reactions.hearts || 0,
            dislikes: reactions.dislikes || 0
          }
        } as BlogComment;
      });
    },
  });

  // Record article read when user views the article
  useEffect(() => {
    if (article && user) {
      const recordArticleRead = async () => {
        try {
          // Add to user's activities that they read this article
          await appendToActivities(user.id, {
            type: 'blog_read',
            article_id: article.id,
            article_title: article.title,
            timestamp: new Date().toISOString(),
            description: `Read article: ${article.title}`
          });
          
          console.log('Article read recorded');
        } catch (error) {
          console.error('Error recording article read:', error);
        }
      };
      
      recordArticleRead();
    }
  }, [article, user]);

  const handleSubmitComment = async (content: string) => {
    try {
      const { error } = await supabase
        .from('blog_article_comments')
        .insert({
          article_id: postId,
          content,
          user_email: commentorEmail || (user?.email || 'Anonymous')
        });

      if (error) throw error;
      
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully",
      });
      
      setCommentorEmail('');
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

  const handleShare = () => {
    if (!article) return;
    
    const shareUrl = window.location.href;
    const shareTitle = article.title;
    
    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`;
    window.open(whatsappShareUrl, '_blank', 'noopener,noreferrer');
  };

  const shareOnSocial = (platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp') => {
    if (!article) return;
    
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`Check out this blog article: ${article.title}`);
    
    let url = '';
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${shareText}%20${shareUrl}`;
        break;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoadingPost) {
    return (
      <div className="relative min-h-screen">
        <WaveBackground />
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
      </div>
    );
  }

  if (postError) {
    return (
      <div className="relative min-h-screen">
        <WaveBackground />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Oops!</h1>
          <p className="text-muted-foreground mb-8">We couldn't find the blog post you're looking for.</p>
          <div className="max-w-lg mx-auto p-4 bg-background/80 backdrop-blur-sm rounded-lg shadow mb-6">
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium mb-2">View error details</summary>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
                {JSON.stringify(postError, null, 2)}
              </pre>
            </details>
          </div>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="relative min-h-screen">
        <WaveBackground />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Blog Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The post you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Split article content into paragraphs
  const articleParagraphs = article?.content.split('\n\n') || [];
  // Calculate middle point for ad insertion
  const middleIndex = Math.floor(articleParagraphs.length / 2);

  return (
    <div className="relative min-h-screen">
      <WaveBackground />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Posts
          </Link>
        </Button>

        <motion.article 
          className="max-w-3xl mx-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 md:p-8 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>{new Date(article?.created_at || '').toLocaleDateString()}</span>
              <span>•</span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {article?.category}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {article?.title}
            </h1>
            {article?.author_name && (
              <p className="text-muted-foreground">By {article.author_name}</p>
            )}
            
            <div className="flex items-center gap-3 mt-4">
              <span className="text-sm text-muted-foreground">Share:</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full w-8 h-8 p-0" 
                onClick={handleShare}
              >
                <Share2 size={16} />
                <span className="sr-only">Share</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full w-8 h-8 p-0 text-blue-600" 
                onClick={() => shareOnSocial('facebook')}
              >
                <Facebook size={16} />
                <span className="sr-only">Share on Facebook</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full w-8 h-8 p-0 text-sky-500" 
                onClick={() => shareOnSocial('twitter')}
              >
                <Twitter size={16} />
                <span className="sr-only">Share on Twitter</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full w-8 h-8 p-0 text-blue-700" 
                onClick={() => shareOnSocial('linkedin')}
              >
                <Linkedin size={16} />
                <span className="sr-only">Share on LinkedIn</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full w-8 h-8 p-0 bg-green-50 border-green-200" 
                onClick={() => shareOnSocial('whatsapp')}
              >
                <MessageSquareShare size={16} className="text-green-600 fill-green-100" />
                <span className="sr-only">Share on WhatsApp</span>
              </Button>
            </div>
          </header>

          {article?.image_url && (
            <img 
              src={article.image_url} 
              alt={article.title}
              className="w-full h-auto max-h-[400px] object-cover rounded-lg mb-8"
            />
          )}

          <div className="prose prose-slate dark:prose-invert max-w-none">
            {/* Display content with ad in the middle */}
            {articleParagraphs.map((paragraph, index) => (
              <React.Fragment key={index}>
                <p className="text-lg leading-relaxed mb-6">{paragraph}</p>
                
                {/* Insert ad in the middle of the article */}
                {index === middleIndex && (
                  <div className="my-6">
                    <AdPlacement location="article-middle" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Bottom advertisement */}
          <div className="my-10">
            <AdPlacement location="footer" />
          </div>

          <Separator className="my-12" />

          <motion.section 
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-2xl font-semibold mb-6">Comments</h2>
          
            <Card className="p-6 mb-12 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Your email (optional)"
                  value={commentorEmail}
                  onChange={(e) => setCommentorEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <CommentForm onSubmit={handleSubmitComment} />
            </Card>
          
            {isLoadingComments ? (
              <div className="space-y-4 mt-8">
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
              <div className="text-center p-6 bg-background/80 backdrop-blur-sm rounded-lg mt-8">
                <p className="text-muted-foreground mb-2">
                  Failed to load comments. Please try again later.
                </p>
                <Button size="sm" onClick={() => refetchComments()}>
                  Retry
                </Button>
              </div>
            ) : commentsData && commentsData.length > 0 ? (
              <div className="mt-8">
                <CommentList 
                  comments={commentsData} 
                  onReactionUpdate={refetchComments}
                />
              </div>
            ) : (
              <p className="text-center text-muted-foreground p-6 bg-background/80 backdrop-blur-sm rounded-lg mt-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}
          </motion.section>
        </motion.article>
      </div>
    </div>
  );
};

export default BlogPostPage;
