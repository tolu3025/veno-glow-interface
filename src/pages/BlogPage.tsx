
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
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
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlogPosts = async () => {
      setIsLoading(true);
      try {
        // Since the external WordPress API is currently not working properly,
        // we'll use the sample data for now and display a toast notification
        throw new Error('Blog API is temporarily unavailable');
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
        // Fallback to sample data if API fails
        const sampleData = getSampleBlogPosts();
        setPosts(sampleData);
        
        // Show toast notification
        toast({
          title: "Using sample blog content",
          description: "We're temporarily displaying sample blog content while our API is being updated.",
          variant: "default"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogPosts();
  }, [toast]);

  const getSampleBlogPosts = (): BlogPost[] => [
    {
      id: '1',
      title: 'Getting Started with Veno Learning Platform',
      content: '<p>Welcome to Veno! This comprehensive guide will help you get started with our learning platform and discover all the features that can enhance your educational journey.</p><p>Veno offers a wide range of tools designed to make learning more effective, engaging, and personalized. From creating custom assessments to analyzing student performance, our platform provides everything educators need to deliver high-quality instruction.</p><p>In this guide, we\'ll walk you through the key features of Veno and provide step-by-step instructions for getting started.</p>',
      excerpt: 'A complete guide to getting started with the Veno learning platform.',
      date: '2024-04-01',
      author: 'Veno Team',
      featuredImage: 'https://placehold.co/600x400/3b82f6/ffffff?text=Veno+Learning',
      slug: 'getting-started-with-veno'
    },
    {
      id: '2',
      title: 'How to Create Effective CBT Tests',
      content: '<p>Creating effective computer-based tests can significantly improve student engagement and learning outcomes. This article provides best practices for designing tests that accurately assess student knowledge and skills.</p><p>CBT (Computer-Based Testing) offers numerous advantages over traditional paper-based assessments, including immediate feedback, adaptive questioning, and comprehensive analytics. However, designing effective CBT tests requires careful consideration of various factors.</p><p>In this article, we\'ll explore strategies for creating engaging and effective computer-based tests that enhance the learning experience.</p>',
      excerpt: 'Learn the best practices for creating engaging and effective computer-based tests.',
      date: '2024-03-25',
      author: 'Education Expert',
      featuredImage: 'https://placehold.co/600x400/22c55e/ffffff?text=CBT+Tests',
      slug: 'effective-cbt-tests'
    },
    {
      id: '3',
      title: 'Understanding Learning Analytics',
      content: '<p>Learning analytics can provide valuable insights into student performance and help identify areas for improvement. This article explores how educators can leverage data to enhance teaching and learning.</p><p>By analyzing patterns in student data, educators can identify struggling students, assess the effectiveness of instructional strategies, and make data-driven decisions to improve learning outcomes.</p><p>In this article, we\'ll discuss the benefits of learning analytics and provide guidance on how to use data effectively in educational settings.</p>',
      excerpt: 'Discover how to use learning analytics to improve educational outcomes.',
      date: '2024-03-18',
      author: 'Data Analyst',
      featuredImage: 'https://placehold.co/600x400/ef4444/ffffff?text=Learning+Analytics',
      slug: 'understanding-learning-analytics'
    },
    {
      id: '4',
      title: 'The Future of Education Technology',
      content: '<p>Education technology is rapidly evolving, with new tools and platforms emerging to address the changing needs of learners. This article explores the latest trends and innovations in edtech.</p><p>From artificial intelligence and virtual reality to personalized learning paths and gamification, technology is transforming how students learn and how educators teach.</p><p>In this article, we\'ll discuss the most promising educational technologies and their potential impact on the future of education.</p>',
      excerpt: 'Explore the latest trends and innovations in education technology.',
      date: '2024-03-10',
      author: 'Tech Educator',
      featuredImage: 'https://placehold.co/600x400/8b5cf6/ffffff?text=EdTech+Future',
      slug: 'future-of-edtech'
    },
    {
      id: '5',
      title: 'Strategies for Effective Remote Learning',
      content: '<p>Remote learning presents unique challenges and opportunities for both educators and students. This article provides strategies for creating engaging and effective remote learning experiences.</p><p>From establishing clear communication channels to designing interactive activities, there are many ways to enhance the remote learning experience and ensure students stay engaged and motivated.</p><p>In this article, we\'ll share best practices for delivering high-quality instruction in a remote learning environment.</p>',
      excerpt: 'Learn how to create engaging and effective remote learning experiences.',
      date: '2024-03-05',
      author: 'Remote Learning Specialist',
      featuredImage: 'https://placehold.co/600x400/ec4899/ffffff?text=Remote+Learning',
      slug: 'effective-remote-learning'
    },
    {
      id: '6',
      title: 'Incorporating Multimedia in Educational Content',
      content: '<p>Multimedia elements can significantly enhance educational content by making it more engaging and accessible. This article explores how to effectively incorporate multimedia into learning materials.</p><p>From videos and interactive simulations to infographics and podcasts, multimedia resources can cater to different learning styles and help students better understand complex concepts.</p><p>In this article, we\'ll provide guidance on selecting and integrating multimedia elements to enhance educational content.</p>',
      excerpt: 'Discover how multimedia elements can enhance educational content.',
      date: '2024-02-28',
      author: 'Multimedia Specialist',
      featuredImage: 'https://placehold.co/600x400/64748b/ffffff?text=Educational+Multimedia',
      slug: 'multimedia-in-education'
    },
    {
      id: '7',
      title: 'Accessibility in Online Education',
      content: '<p>Creating accessible online education materials is essential for ensuring all students have equal access to learning opportunities. This article discusses key considerations for designing accessible educational content.</p><p>From providing alternative text for images to ensuring keyboard navigability, there are many ways to make online learning materials more accessible to students with disabilities.</p><p>In this article, we\'ll explore best practices for creating inclusive online education experiences.</p>',
      excerpt: 'Learn how to create accessible online education materials.',
      date: '2024-02-22',
      author: 'Accessibility Advocate',
      featuredImage: 'https://placehold.co/600x400/f59e0b/ffffff?text=Educational+Accessibility',
      slug: 'accessibility-in-education'
    },
    {
      id: '8',
      title: 'Gamification in Educational Settings',
      content: '<p>Gamification can transform learning experiences by making them more engaging and motivating. This article explores how to effectively incorporate game elements into educational contexts.</p><p>From points and badges to leaderboards and challenges, gamification strategies can increase student engagement and promote a positive attitude toward learning.</p><p>In this article, we\'ll discuss practical ways to implement gamification in various educational settings.</p>',
      excerpt: 'Discover how gamification can enhance learning experiences.',
      date: '2024-02-15',
      author: 'Gamification Expert',
      featuredImage: 'https://placehold.co/600x400/10b981/ffffff?text=Gamification+in+Education',
      slug: 'gamification-in-education'
    }
  ];

  // Get current posts based on pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const renderBlogPost = (post: BlogPost) => (
    <Card key={post.id} className="overflow-hidden h-full flex flex-col">
      {post.featuredImage && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={post.featuredImage} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
          />
        </div>
      )}
      <CardHeader className="flex-none">
        <CardTitle className="line-clamp-2">{post.title}</CardTitle>
        <CardDescription>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>By {post.author}</span>
            <span className="mx-2">•</span>
            <span>{post.date}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div 
          className="text-sm text-muted-foreground line-clamp-3"
          dangerouslySetInnerHTML={{ __html: post.excerpt }}
        />
      </CardContent>
      <CardFooter className="flex-none">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/blog/post/${post.slug}`, { state: { post } })}
        >
          Read More
        </Button>
      </CardFooter>
    </Card>
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <AdPlacement location="header" contentCheck={false} />
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
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-lg text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPosts.map(renderBlogPost)}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="my-8">
              <Pagination>
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                    </PaginationItem>
                  )}
                  
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink 
                        isActive={currentPage === index + 1}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
          
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
        <AdPlacement location="footer" contentCheck={false} />
      </div>
    </div>
  );
};

export default BlogPage;
