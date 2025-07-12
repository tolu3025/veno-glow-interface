import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export type TestBlogPost = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: string;
  image_url: string | null;
  author_name: string | null;
  author_id: string | null;
  author_avatar: string | null;
  slug: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  published: boolean;
};

export const useTestBlogs = (subject?: string) => {
  const query = useQuery({
    queryKey: ['test-blogs', subject],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .eq('category', 'test')
        .order('created_at', { ascending: false });

      // Filter by subject if provided
      if (subject) {
        queryBuilder = queryBuilder.ilike('content', `%${subject}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error fetching test blogs:', error);
        throw error;
      }

      return (data || []) as TestBlogPost[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Set up real-time subscription for blog posts
  useEffect(() => {
    const channel = supabase
      .channel('test-blogs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_posts',
          filter: 'category=eq.test'
        },
        (payload) => {
          console.log('Real-time update received for test blogs:', payload);
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query.refetch]);

  return query;
};