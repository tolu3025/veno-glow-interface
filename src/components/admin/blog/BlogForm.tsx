
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BlogFormProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    title: string;
    content: string;
    excerpt: string;
    category: string;
    author_name: string;
    published: boolean;
    image_url: string;
  };
  onFormDataChange: (data: any) => void;
  onSave: () => void;
  isEditing: boolean;
  categories: string[];
}

const BlogForm: React.FC<BlogFormProps> = ({
  isOpen,
  onClose,
  formData,
  onFormDataChange,
  onSave,
  isEditing,
  categories
}) => {
  const handleFieldChange = (field: string, value: any) => {
    onFormDataChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Article' : 'Create New Article'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the article details' : 'Create a new blog article'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Article title"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category || ''}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="author">Author Name</Label>
              <Input
                id="author"
                value={formData.author_name || ''}
                onChange={(e) => handleFieldChange('author_name', e.target.value)}
                placeholder="Author name"
              />
            </div>
            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url || ''}
                onChange={(e) => handleFieldChange('image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt || ''}
              onChange={(e) => handleFieldChange('excerpt', e.target.value)}
              placeholder="Brief summary of the article"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content || ''}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              placeholder="Article content (Markdown supported)"
              rows={10}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={formData.published || false}
              onCheckedChange={(checked) => handleFieldChange('published', checked)}
            />
            <Label htmlFor="published">Publish immediately</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            {isEditing ? 'Update Article' : 'Create Article'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlogForm;
