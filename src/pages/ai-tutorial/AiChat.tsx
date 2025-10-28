import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AiChat = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/maintenance');
  }, [navigate]);

  return null;
};

export default AiChat;
