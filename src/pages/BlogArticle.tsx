
import React from 'react';
import { useParams } from 'react-router-dom';

const BlogArticle = () => {
  const { id } = useParams();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Blog Article {id}</h1>
      <p className="text-muted-foreground">Blog article content will be added here.</p>
    </div>
  );
};

export default BlogArticle;
