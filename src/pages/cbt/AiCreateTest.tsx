import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AiCreateTest = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main create test page which has the proper billing flow
    navigate('/cbt/create-test', { replace: true });
  }, [navigate]);

  return null;
};

export default AiCreateTest;
