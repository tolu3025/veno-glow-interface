import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AiResources = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/maintenance');
  }, [navigate]);

  return null;
};

export default AiResources;
