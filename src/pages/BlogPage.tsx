
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

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
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Oops!</h1>
        <p className="text-muted-foreground">Failed to load blog posts. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Veno Blog</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts?.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <img 
              src={post.image_url} 
              alt={post.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {post.category}
                </span>
              </div>
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-muted-foreground">{post.excerpt}</p>
              {post.author_name && (
                <p className="mt-4 text-sm text-muted-foreground">
                  By {post.author_name}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
