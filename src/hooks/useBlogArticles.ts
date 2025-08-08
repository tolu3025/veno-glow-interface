
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  author_name?: string;
  published: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export const useBlogArticles = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  const fetchArticles = useCallback(async () => {
    if (isFetchingRef.current) { console.log('Fetch skipped: already in progress'); return; }
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching blog articles...');
      
      // Use blog_posts table for consistency with other hooks
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Supabase error fetching articles:', fetchError);
        setError(`Failed to fetch articles: ${fetchError.message}`);
        toast.error(`Failed to fetch articles: ${fetchError.message}`);
        return;
      }
      
      console.log(`Successfully fetched ${(data || []).length} blog articles`);
      setArticles(data || []);
      
      if ((data || []).length === 0) {
        toast.info('No blog articles found');
      }
    } catch (err: any) {
      console.error('Unexpected error fetching articles:', err);
      const errorMessage = err?.message || 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to fetch articles: ${errorMessage}`);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  const createArticle = useCallback(async (articleData: Omit<BlogArticle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Creating new article:', articleData);
      
      const { data, error: createError } = await supabase
        .from('blog_posts')
        .insert([{
          title: articleData.title || '',
          content: articleData.content || '',
          excerpt: articleData.excerpt || null,
          category: articleData.category || '',
          author_name: articleData.author_name || null,
          published: articleData.published || false,
          image_url: articleData.image_url || null
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating article:', createError);
        throw createError;
      }

      console.log('Article created successfully:', data);
      toast.success('Article created successfully');
      await fetchArticles();
      return data;
    } catch (err: any) {
      console.error('Failed to create article:', err);
      toast.error(`Failed to create article: ${err.message}`);
      throw err;
    }
  }, []);

  const updateArticle = useCallback(async (id: string, articleData: Partial<BlogArticle>) => {
    try {
      console.log('Updating article:', id, articleData);
      
      const { data, error: updateError } = await supabase
        .from('blog_posts')
        .update({
          title: articleData.title,
          content: articleData.content,
          excerpt: articleData.excerpt || null,
          category: articleData.category,
          author_name: articleData.author_name || null,
          published: articleData.published,
          image_url: articleData.image_url || null
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating article:', updateError);
        throw updateError;
      }

      console.log('Article updated successfully:', data);
      toast.success('Article updated successfully');
      await fetchArticles();
      return data;
    } catch (err: any) {
      console.error('Failed to update article:', err);
      toast.error(`Failed to update article: ${err.message}`);
      throw err;
    }
  }, []);

  const deleteArticle = useCallback(async (id: string) => {
    try {
      console.log('Deleting article:', id);
      
      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting article:', deleteError);
        throw deleteError;
      }

      console.log('Article deleted successfully');
      toast.success('Article deleted successfully');
      await fetchArticles();
    } catch (err: any) {
      console.error('Failed to delete article:', err);
      toast.error(`Failed to delete article: ${err.message}`);
      throw err;
    }
  }, []);

  const togglePublished = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      console.log('Toggling published status for article:', id, 'from', currentStatus, 'to', !currentStatus);
      
      const { error: toggleError } = await supabase
        .from('blog_posts')
        .update({ published: !currentStatus })
        .eq('id', id);

      if (toggleError) {
        console.error('Error toggling article status:', toggleError);
        throw toggleError;
      }

      console.log('Article status toggled successfully');
      toast.success(`Article ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      await fetchArticles();
    } catch (err: any) {
      console.error('Failed to toggle article status:', err);
      toast.error(`Failed to update article status: ${err.message}`);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return {
    articles,
    loading,
    error,
    fetchArticles,
    createArticle,
    updateArticle,
    deleteArticle,
    togglePublished
  };
};
