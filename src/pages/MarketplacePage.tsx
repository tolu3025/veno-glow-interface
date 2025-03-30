
import { useEffect } from "react";

const MarketplacePage = () => {
  useEffect(() => {
    // Redirect to external marketplace
    window.location.href = "https://venomarketplace.vercel.app/";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-3">Redirecting to Marketplace</h1>
        <p className="text-muted-foreground">Please wait while we redirect you to the Veno Marketplace...</p>
      </div>
    </div>
  );
};

export default MarketplacePage;
