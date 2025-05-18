
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

type Content = {
  id: string;
  title: string;
  type: string;
  category?: string;
  subject?: string;
  created_at: string;
  published?: boolean;
};

const ContentManagement = () => {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddContentDialogOpen, setIsAddContentDialogOpen] = useState(false);
  const [contentType, setContentType] = useState("blog");
  const [newContent, setNewContent] = useState({
    title: "",
    content: "",
    category: "",
    subject: "",
    published: true
  });

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Fetch blog articles
      const { data: blogArticles, error: blogError } = await supabase
        .from('blog_articles')
        .select('id, title, category, created_at, published');
      
      if (blogError) throw new Error(blogError.message);
      
      // Fetch tutorials
      const { data: tutorials, error: tutorialsError } = await supabase
        .from('tutorials')
        .select('id, title, subject, created_at');
      
      if (tutorialsError) throw new Error(tutorialsError.message);
      
      // Combine and map content items
      const blogItems = (blogArticles || []).map((item): Content => ({
        id: item.id,
        title: item.title,
        type: 'blog',
        category: item.category,
        created_at: item.created_at,
        published: item.published
      }));
      
      const tutorialItems = (tutorials || []).map((item): Content => ({
        id: item.id,
        title: item.title,
        type: 'tutorial',
        subject: item.subject,
        created_at: item.created_at,
        published: true
      }));
      
      setContent([...blogItems, ...tutorialItems]);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleAddContent = async () => {
    try {
      if (!newContent.title) {
        toast.error('Title is required');
        return;
      }
      
      if (contentType === 'blog') {
        const { error } = await supabase
          .from('blog_articles')
          .insert([{ 
            title: newContent.title,
            content: newContent.content,
            category: newContent.category,
            published: newContent.published,
            excerpt: newContent.content.substring(0, 150) + '...'
          }]);
        
        if (error) throw new Error(error.message);
      } else {
        // Tutorial content
        const { error } = await supabase
          .from('tutorials')
          .insert([{
            title: newContent.title,
            description: newContent.content,
            subject: newContent.subject,
            level: 'Beginner',
            price: 0, // Free tutorial
            duration: '10 minutes'
          }]);
        
        if (error) throw new Error(error.message);
      }
      
      toast.success(`${contentType === 'blog' ? 'Blog article' : 'Tutorial'} created successfully`);
      setIsAddContentDialogOpen(false);
      resetContentForm();
      fetchContent();
    } catch (error) {
      console.error('Error creating content:', error);
      toast.error('Failed to create content: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const resetContentForm = () => {
    setNewContent({
      title: "",
      content: "",
      category: "",
      subject: "",
      published: true
    });
  };

  const handleDeleteContent = async (contentId: string, type: string) => {
    if (confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      try {
        if (type === 'blog') {
          const { error } = await supabase
            .from('blog_articles')
            .delete()
            .eq('id', contentId);
          
          if (error) throw new Error(error.message);
        } else {
          const { error } = await supabase
            .from('tutorials')
            .delete()
            .eq('id', contentId);
          
          if (error) throw new Error(error.message);
        }
        
        toast.success('Content deleted successfully');
        fetchContent();
      } catch (error) {
        console.error('Error deleting content:', error);
        toast.error('Failed to delete content');
      }
    }
  };

  // Filter content based on search
  const filteredContent = searchQuery 
    ? content.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : content;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <Button onClick={() => setIsAddContentDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Content
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="blog">Blog Articles</TabsTrigger>
          <TabsTrigger value="tutorial">Tutorials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <ContentTable 
            content={filteredContent} 
            loading={loading} 
            onDelete={handleDeleteContent}
          />
        </TabsContent>
        
        <TabsContent value="blog" className="mt-4">
          <ContentTable 
            content={filteredContent.filter(item => item.type === 'blog')} 
            loading={loading} 
            onDelete={handleDeleteContent}
          />
        </TabsContent>
        
        <TabsContent value="tutorial" className="mt-4">
          <ContentTable 
            content={filteredContent.filter(item => item.type === 'tutorial')} 
            loading={loading} 
            onDelete={handleDeleteContent}
          />
        </TabsContent>
      </Tabs>
      
      <Dialog open={isAddContentDialogOpen} onOpenChange={setIsAddContentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Content</DialogTitle>
            <DialogDescription>
              Create a new piece of content for your platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <div className="flex space-x-2">
                <Button 
                  variant={contentType === 'blog' ? 'default' : 'outline'}
                  onClick={() => setContentType('blog')}
                >
                  Blog Article
                </Button>
                <Button 
                  variant={contentType === 'tutorial' ? 'default' : 'outline'}
                  onClick={() => setContentType('tutorial')}
                >
                  Tutorial
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="Enter title" 
                value={newContent.title}
                onChange={(e) => setNewContent({...newContent, title: e.target.value})}
              />
            </div>
            
            {contentType === 'blog' && (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  placeholder="E.g., Technology, Health, Education" 
                  value={newContent.category}
                  onChange={(e) => setNewContent({...newContent, category: e.target.value})}
                />
              </div>
            )}
            
            {contentType === 'tutorial' && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="E.g., Math, Science, Programming" 
                  value={newContent.subject}
                  onChange={(e) => setNewContent({...newContent, subject: e.target.value})}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea 
                id="content" 
                placeholder="Write your content here..." 
                rows={6}
                value={newContent.content}
                onChange={(e) => setNewContent({...newContent, content: e.target.value})}
              />
            </div>
            
            {contentType === 'blog' && (
              <div className="space-y-2">
                <Label htmlFor="published">Status</Label>
                <Select 
                  value={newContent.published ? "published" : "draft"}
                  onValueChange={(value) => setNewContent({...newContent, published: value === "published"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddContentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContent}>
              Create Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for the content table
const ContentTable = ({ content, loading, onDelete }: { 
  content: Content[], 
  loading: boolean,
  onDelete: (id: string, type: string) => void
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (content.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            No content found
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category/Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <Badge variant={item.type === 'blog' ? 'secondary' : 'default'}>
                    {item.type === 'blog' ? 'Blog Article' : 'Tutorial'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.category || item.subject || 'Uncategorized'}
                </TableCell>
                <TableCell>
                  {item.published === false ? (
                    <Badge variant="outline">Draft</Badge>
                  ) : (
                    <Badge variant="success">Published</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(item.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" asChild>
                    <a 
                      href={item.type === 'blog' ? `/blog/${item.id}` : `/tutorial/watch?id=${item.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(item.id, item.type)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ContentManagement;
