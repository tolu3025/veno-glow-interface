
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WaveBackground from '@/components/blog/WaveBackground';
import { motion } from 'framer-motion';
import AdPlacement from '@/components/ads/AdPlacement';
import { Share2 } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  author_name: string | null;
  created_at: string;
  category: string;
}

const BlogPage = () => {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      try {
        // Use a more direct query approach that bypasses RLS issues
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching blog posts:', error);
          throw error;
        }
        
        console.log('Blog posts fetched successfully:', data);
        return data as BlogPost[];
      } catch (err) {
        console.error('Exception fetching blog posts:', err);
        throw err;
      }
    }
  });

  const handleSharePost = (post: BlogPost) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.origin + `/blog/${post.id}`,
      })
      .then(() => toast({ title: "Shared successfully" }))
      .catch((error) => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.origin + `/blog/${post.id}`)
        .then(() => toast({ 
          title: "Link copied to clipboard",
          description: "You can now share this post with others"
        }))
        .catch(() => toast({ 
          title: "Could not copy link",
          variant: "destructive"
        }));
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <WaveBackground />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Veno Blog</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-muted" />
                <div className="p-6">
                  <div className="h-4 w-24 bg-muted mb-2 rounded" />
                  <div className="h-6 w-full bg-muted mb-2 rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen">
        <WaveBackground />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Oops!</h1>
          <p className="text-muted-foreground mb-6">Failed to load blog posts. Please try again later.</p>
          <div className="max-w-lg mx-auto p-4 bg-background/80 backdrop-blur-sm rounded-lg shadow">
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium mb-2">View error details</summary>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          </div>
          <Button 
            variant="default" 
            className="mt-6"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <WaveBackground />
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          className="max-w-2xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Veno Blog
          </h1>
          <p className="text-xl text-muted-foreground">
            Explore our latest insights on education, technology, and learning strategies
          </p>
        </motion.div>

        {/* Top ad banner */}
        <div className="mb-10">
          <AdPlacement location="header" />
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts && posts.length > 0 ? (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-0 h-full flex flex-col">
                  <Link to={`/blog/${post.id}`} className="block">
                    <div className="relative overflow-hidden">
                      <img 
                        src={post.image_url || "/placeholder.svg"} 
                        alt={post.title}
                        className="w-full h-48 object-cover transition-transform hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  </Link>
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                    <Link to={`/blog/${post.id}`} className="block group flex-grow">
                      <h2 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>
                    <p className="text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex justify-between items-center mt-auto pt-3">
                      {post.author_name && (
                        <p className="text-sm text-muted-foreground">
                          By {post.author_name}
                        </p>
                      )}
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSharePost(post)}
                          className="hover:text-primary"
                        >
                          <Share2 size={16} className="mr-1" />
                          Share
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/blog/${post.id}`}>Read more</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <p className="text-muted-foreground">No blog posts available at the moment.</p>
            </div>
          )}
        </div>
        
        {/* Bottom ad banner */}
        <div className="mt-12">
          <AdPlacement location="footer" />
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
