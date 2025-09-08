
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2, Eye, Loader } from 'lucide-react';

interface BlogArticle {
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

interface BlogTableProps {
  articles: BlogArticle[];
  loading: boolean;
  onEdit: (article: BlogArticle) => void;
  onDelete: (articleId: string) => void;
  onTogglePublished: (articleId: string, currentStatus: boolean) => void;
}

const BlogTable: React.FC<BlogTableProps> = ({
  articles,
  loading,
  onEdit,
  onDelete,
  onTogglePublished
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No articles found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {articles.map((article) => (
          <TableRow key={article.id}>
            <TableCell className="max-w-md">
              <div className="truncate font-medium">{article.title || 'Untitled'}</div>
              {article.excerpt && (
                <div className="text-sm text-muted-foreground truncate">
                  {article.excerpt}
                </div>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{article.category || 'Uncategorized'}</Badge>
            </TableCell>
            <TableCell>{article.author_name || 'Unknown'}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant={article.published ? "default" : "secondary"}>
                  {article.published ? 'Published' : 'Draft'}
                </Badge>
                <Switch
                  checked={article.published || false}
                  onCheckedChange={() => onTogglePublished(article.id, article.published)}
                />
              </div>
            </TableCell>
            <TableCell>
              {article.created_at 
                ? new Date(article.created_at).toLocaleDateString()
                : 'Unknown'
              }
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`/blog/${article.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(article)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(article.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BlogTable;
