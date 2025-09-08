
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from 'lucide-react';
import { useBlogArticles, BlogArticle } from '@/hooks/useBlogArticles';
import BlogForm from '@/components/admin/blog/BlogForm';
import BlogTable from '@/components/admin/blog/BlogTable';

const AdminBlog = () => {
  const { 
    articles, 
    loading, 
    error, 
    createArticle, 
    updateArticle, 
    deleteArticle, 
    togglePublished 
  } = useBlogArticles();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    author_name: '',
    published: true,
    image_url: ''
  });

  const categories = [
    'Education', 'Technology', 'Science', 'Health', 'Business', 
    'Lifestyle', 'News', 'Tutorial', 'Review', 'Opinion', 'test'
  ];

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      author_name: '',
      published: true,
      image_url: ''
    });
    setEditingArticle(null);
  };

  const handleSaveArticle = async () => {
    if (!formData.title || !formData.content || !formData.category) {
      console.error('Validation failed: Missing required fields', formData);
      return;
    }

    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, formData);
      } else {
        await createArticle(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save article:', error);
      // Error handling is done in the hook
    }
  };

  const handleEditArticle = (article: BlogArticle) => {
    console.log('Editing article:', article.id);
    setEditingArticle(article);
    setFormData({
      title: article.title || '',
      content: article.content || '',
      excerpt: article.excerpt || '',
      category: article.category || '',
      author_name: article.author_name || '',
      published: article.published || false,
      image_url: article.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    await deleteArticle(articleId);
  };

  const filteredArticles = articles.filter(article =>
    (article.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (article.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (article.author_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    console.error('AdminBlog component error:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-muted-foreground">Create and manage blog articles</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Article
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
          <CardDescription>
            Manage all blog articles
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <BlogTable
            articles={filteredArticles}
            loading={loading}
            onEdit={handleEditArticle}
            onDelete={handleDeleteArticle}
            onTogglePublished={togglePublished}
          />
        </CardContent>
      </Card>

      <BlogForm
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSaveArticle}
        isEditing={!!editingArticle}
        categories={categories}
      />
    </div>
  );
};

export default AdminBlog;
