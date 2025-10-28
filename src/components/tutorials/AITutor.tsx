import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AITutorProps {
  subject: string;
  topic?: string;
  onBack?: () => void;
}

const AITutor: React.FC<AITutorProps> = ({ onBack }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to maintenance but call onBack if provided
    if (onBack) {
      onBack();
    } else {
      navigate('/maintenance');
    }
  }, [navigate, onBack]);

  return null;
};

export default AITutor;
