
import { ArrowLeft, Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BlogPage = () => {
  const navigate = useNavigate();
  
  const articles = [
    {
      title: "Getting Started with Veno CBT",
      excerpt: "Learn how to maximize your learning potential with our computer-based training platform.",
      date: "May 15, 2023",
      author: "Sarah Johnson",
      readTime: "5 min read",
      category: "Tutorial"
    },
    {
      title: "New Features in Veno Marketplace",
      excerpt: "Discover the latest improvements and additions to our digital marketplace.",
      date: "May 10, 2023",
      author: "Michael Chen",
      readTime: "4 min read",
      category: "News"
    },
    {
      title: "The Future of AI Assistants",
      excerpt: "How Veno Bot is changing the way we interact with artificial intelligence.",
      date: "May 5, 2023",
      author: "Alicia Rodriguez",
      readTime: "8 min read",
      category: "Technology"
    }
  ];

  return (
    <div className="pb-6">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Veno Blog</h1>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="veno-card p-5 mb-6"
      >
        <div className="h-40 bg-veno-muted rounded-lg flex items-center justify-center mb-4">
          <span className="text-veno-primary/70">Featured Article Image</span>
        </div>
        <div className="flex space-x-2 mb-2">
          <span className="text-xs font-medium bg-veno-primary/10 text-veno-primary px-2 py-1 rounded">
            Featured
          </span>
        </div>
        <h2 className="text-xl font-semibold mb-2">The Evolution of Digital Learning Platforms</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Explore how digital learning has transformed education and professional development in the last decade.
        </p>
        <div className="flex items-center text-xs text-muted-foreground">
          <User size={12} className="mr-1" /> Alex Martinez • 
          <Calendar size={12} className="ml-2 mr-1" /> June 1, 2023 • 
          <span className="ml-2">12 min read</span>
        </div>
      </motion.div>
      
      <h2 className="text-lg font-semibold mb-4">Latest Articles</h2>
      
      <div className="space-y-4">
        {articles.map((article, index) => (
          <motion.div 
            key={article.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="veno-card p-5"
          >
            <div className="flex space-x-2 mb-2">
              <span className="text-xs font-medium bg-secondary px-2 py-1 rounded">
                {article.category}
              </span>
            </div>
            <h3 className="font-semibold mb-1">{article.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {article.excerpt}
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              <User size={12} className="mr-1" /> {article.author} • 
              <Calendar size={12} className="ml-2 mr-1" /> {article.date} • 
              <span className="ml-2">{article.readTime}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
