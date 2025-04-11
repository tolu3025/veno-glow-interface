
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AdPlacement from "@/components/ads/AdPlacement";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  author: string;
  featuredImage?: string;
  slug: string;
}

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlogPosts = async () => {
      setIsLoading(true);
      try {
        // We'll use a proxy or fetch directly from the blog API
        // For now, we'll use sample data but in production this would be a real API call
        const response = await fetch('https://venoblog.venobot.online/wp-json/wp/v2/posts?_embed');
        
        if (!response.ok) {
          throw new Error('Failed to fetch blog posts');
        }
        
        const data = await response.json();
        
        // Transform WordPress data to our format
        const formattedPosts = data.map((post: any) => ({
          id: post.id.toString(),
          title: post.title.rendered,
          content: post.content.rendered,
          excerpt: post.excerpt.rendered,
          date: new Date(post.date).toLocaleDateString(),
          author: post._embedded?.author?.[0]?.name || 'Veno Team',
          featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
          slug: post.slug
        }));
        
        setPosts(formattedPosts);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
        // Fallback to sample data if API fails
        setPosts(getSampleBlogPosts());
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  const getSampleBlogPosts = (): BlogPost[] => [
    {
      id: '1',
      title: 'Getting Started with Veno Learning Platform',
      content: '<p>Welcome to Veno! This comprehensive guide will help you get started with our learning platform...</p>',
      excerpt: 'A complete guide to getting started with the Veno learning platform.',
      date: '2024-04-01',
      author: 'Veno Team',
      featuredImage: 'https://placehold.co/600x400/3b82f6/ffffff?text=Veno+Learning',
      slug: 'getting-started-with-veno'
    },
    {
      id: '2',
      title: 'How to Create Effective CBT Tests',
      content: '<p>Creating effective computer-based tests can significantly improve student engagement and learning outcomes...</p>',
      excerpt: 'Learn the best practices for creating engaging and effective computer-based tests.',
      date: '2024-03-25',
      author: 'Education Expert',
      featuredImage: 'https://placehold.co/600x400/22c55e/ffffff?text=CBT+Tests',
      slug: 'effective-cbt-tests'
    },
    {
      id: '3',
      title: 'Understanding Learning Analytics',
      content: '<p>Learning analytics can provide valuable insights into student performance and help identify areas for improvement...</p>',
      excerpt: 'Discover how to use learning analytics to improve educational outcomes.',
      date: '2024-03-18',
      author: 'Data Analyst',
      featuredImage: 'https://placehold.co/600x400/ef4444/ffffff?text=Learning+Analytics',
      slug: 'understanding-learning-analytics'
    },
    {
      id: '4',
      title: 'The Future of Education Technology',
      content: '<p>Education technology is rapidly evolving, with new tools and platforms emerging to address the changing needs of learners...</p>',
      excerpt: 'Explore the latest trends and innovations in education technology.',
      date: '2024-03-10',
      author: 'Tech Educator',
      featuredImage: 'https://placehold.co/600x400/8b5cf6/ffffff?text=EdTech+Future',
      slug: 'future-of-edtech'
    }
  ];

  const renderBlogPost = (post: BlogPost) => (
    <Card key={post.id} className="overflow-hidden">
      {post.featuredImage && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={post.featuredImage} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2">{post.title}</CardTitle>
        <CardDescription>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>By {post.author}</span>
            <span className="mx-2">•</span>
            <span>{post.date}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="text-sm text-muted-foreground line-clamp-3"
          dangerouslySetInnerHTML={{ __html: post.excerpt }}
        />
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={() => window.open(`https://venoblog.venobot.online/${post.slug}`, '_blank')}
        >
          Read More
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container py-4 md:py-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          onClick={() => navigate('/')}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Veno Blog</h1>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Latest articles, tutorials, and updates from the Veno team.
      </p>

      <div className="mb-6">
        <AdPlacement location="header" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video w-full">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-lg text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(renderBlogPost)}
          </div>
          
          <div className="my-8 flex justify-center">
            <Button 
              variant="default"
              onClick={() => window.open('https://venoblog.venobot.online/', '_blank')}
            >
              Visit Full Blog
            </Button>
          </div>
        </>
      )}

      <Separator className="my-6" />
      
      <div className="mb-6">
        <AdPlacement location="footer" />
      </div>
    </div>
  );
};

export default BlogPage;
