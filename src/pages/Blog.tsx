
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Blog = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the main blog page
    navigate('/blog', { replace: true });
  }, [navigate]);
  
  return null;
};

export default Blog;
