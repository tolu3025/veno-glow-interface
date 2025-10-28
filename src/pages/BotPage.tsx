import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BotPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/maintenance');
  }, [navigate]);

  return null;
};

export default BotPage;
