
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WaveBackground from '@/components/blog/WaveBackground';
import { motion } from 'framer-motion';

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
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    }
  });

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
          <p className="text-muted-foreground">Failed to load blog posts. Please try again later.</p>
          <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left overflow-auto max-w-lg mx-auto text-xs">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <WaveBackground />
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          className="max-w-2xl mx-auto text-center mb-16"
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
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts?.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-0">
                <Link to={`/blog/${post.id}`}>
                  <div className="relative overflow-hidden">
                    <img 
                      src={post.image_url || "/placeholder.svg"} 
                      alt={post.title}
                      className="w-full h-48 object-cover transition-transform hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </Link>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <Link to={`/blog/${post.id}`} className="block group">
                    <h2 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                  <div className="flex justify-between items-center">
                    {post.author_name && (
                      <p className="text-sm text-muted-foreground">
                        By {post.author_name}
                      </p>
                    )}
                    <Button asChild variant="outline" size="sm" className="ml-auto">
                      <Link to={`/blog/${post.id}`}>Read more</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
