
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAds } from "@/providers/AdContext";

const MarketplacePage = () => {
  const navigate = useNavigate();
  const { setPageHasContent } = useAds();
  
  useEffect(() => {
    // Mark this page as not having content since it redirects
    setPageHasContent(false);
    
    // Redirect to under maintenance page
    navigate("/maintenance");
  }, [navigate, setPageHasContent]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-3">Redirecting</h1>
        <p className="text-muted-foreground">Please wait while we redirect you...</p>
      </div>
    </div>
  );
};

export default MarketplacePage;
