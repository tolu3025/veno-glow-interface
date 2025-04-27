
import React from 'react';
import { Card } from "@/components/ui/card";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  imageUrl: string;
}

const SAMPLE_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "Getting Started with CBT",
    excerpt: "Learn how computer-based testing can revolutionize your learning experience.",
    date: "2025-04-27",
    imageUrl: "/placeholder.svg"
  },
  {
    id: 2,
    title: "Best Practices for Online Learning",
    excerpt: "Discover effective strategies to maximize your online learning potential.",
    date: "2025-04-26",
    imageUrl: "/placeholder.svg"
  },
  {
    id: 3,
    title: "The Future of Education",
    excerpt: "Explore how technology is shaping the future of education and learning.",
    date: "2025-04-25",
    imageUrl: "/placeholder.svg"
  }
];

const BlogPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Veno Blog</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_POSTS.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-2">{post.date}</p>
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-muted-foreground">{post.excerpt}</p>
              <button className="mt-4 text-primary hover:underline">
                Read more →
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
