
import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

const BlogPostPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams();
  
  // Get post from location state or fetch it based on slug
  const post = location.state?.post as BlogPost | undefined;
  
  if (!post) {
    return (
      <div className="container py-8">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            onClick={() => navigate('/blog')}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Post Not Found</h1>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Sorry, we couldn't find the blog post you're looking for.
          </p>
          <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          onClick={() => navigate('/blog')}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold">Veno Blog</h1>
      </div>
      
      <div className="mb-6">
        <AdPlacement location="header" contentCheck={false} />
      </div>
      
      <article className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">{post.title}</h1>
        
        <div className="flex items-center text-sm text-muted-foreground mb-6">
          <div className="flex items-center">
            <User size={14} className="mr-1" />
            <span>{post.author}</span>
          </div>
          <span className="mx-2">•</span>
          <div className="flex items-center">
            <Calendar size={14} className="mr-1" />
            <span>{post.date}</span>
          </div>
        </div>
        
        {post.featuredImage && (
          <div className="aspect-[21/9] overflow-hidden rounded-lg mb-6">
            <img 
              src={post.featuredImage} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
      
      <div className="mt-12 flex justify-center space-x-4">
        <Button 
          variant="outline"
          onClick={() => navigate('/blog')}
        >
          Back to Blog
        </Button>
        <Button 
          variant="default"
          onClick={() => window.open('https://venoblog.venobot.online/', '_blank')}
        >
          Visit Full Blog
        </Button>
      </div>
      
      <Separator className="my-8" />
      
      <div className="mb-6">
        <AdPlacement location="footer" contentCheck={false} />
      </div>
    </div>
  );
};

export default BlogPostPage;
