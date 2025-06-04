
import React from 'react';
import { useParams } from 'react-router-dom';

const PortfolioItem = () => {
  const { id } = useParams();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Portfolio Item {id}</h1>
      <p className="text-muted-foreground">Portfolio item content will be added here.</p>
    </div>
  );
};

export default PortfolioItem;
