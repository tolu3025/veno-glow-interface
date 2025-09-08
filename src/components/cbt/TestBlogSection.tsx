import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTestBlogs } from '@/hooks/useTestBlogs';
import { BookOpen, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TestBlogSectionProps {
  selectedSubject?: string;
}

const TestBlogSection: React.FC<TestBlogSectionProps> = ({ selectedSubject }) => {
  const { data: blogs, isLoading, error } = useTestBlogs(selectedSubject);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Test Articles
          </CardTitle>
          <CardDescription>
            Loading articles related to your tests...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Test Articles
          </CardTitle>
          <CardDescription className="text-destructive">
            Failed to load articles
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!blogs || blogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Test Articles
          </CardTitle>
          <CardDescription>
            {selectedSubject 
              ? `No articles found for ${selectedSubject}` 
              : 'No test-related articles available'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleReadArticle = (slug: string | null, id: string) => {
    const path = slug ? `/blog/${slug}` : `/blog/post/${id}`;
    navigate(path);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Test Articles
          <Badge variant="secondary">{blogs.length}</Badge>
        </CardTitle>
        <CardDescription>
          {selectedSubject 
            ? `Articles related to ${selectedSubject} tests` 
            : 'Latest articles about tests and studying'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {blogs.slice(0, 3).map((blog) => (
            <div 
              key={blog.id} 
              className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {blog.image_url && (
                <img 
                  src={blog.image_url} 
                  alt={blog.title}
                  className="w-16 h-16 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1 line-clamp-2">
                  {blog.title}
                </h4>
                {blog.excerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {blog.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {blog.author_name && (
                      <span className="text-xs text-muted-foreground">
                        By {blog.author_name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(blog.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleReadArticle(blog.slug, blog.id)}
                    className="h-6 px-2 text-xs"
                  >
                    Read
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {blogs.length > 3 && (
            <div className="text-center pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/blog?category=test')}
              >
                View All Articles
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestBlogSection;