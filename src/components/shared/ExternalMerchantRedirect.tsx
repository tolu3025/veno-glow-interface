import { useEffect } from "react";
import { ExternalLink, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MERCHANT_PORTAL_URL = "https://merchants.kukapay.com.ng";

const ExternalMerchantRedirect = () => {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = MERCHANT_PORTAL_URL;
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="px-5 pt-16 pb-10 flex flex-col items-center text-center space-y-4 max-w-sm mx-auto">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Store className="h-7 w-7 text-primary" />
      </div>
      <h1 className="text-xl font-bold">Merchant tools have moved</h1>
      <p className="text-sm text-muted-foreground">
        Vendor sign-up, dashboards, products and orders now live on
        <br />
        <span className="font-semibold text-foreground">merchants.kukapay.com.ng</span>.
        Redirecting you now…
      </p>
      <Button asChild className="gap-2">
        <a href={MERCHANT_PORTAL_URL}>
          Open merchant portal <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
};

export default ExternalMerchantRedirect;
