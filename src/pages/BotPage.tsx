import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BotPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/ai-assistant');
  }, [navigate]);

  return null;
};

export default BotPage;
