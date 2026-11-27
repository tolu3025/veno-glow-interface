import { ArrowLeft, Store, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PostErrandPage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-10 pb-24 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Request Delivery</h1>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 space-y-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold">Order from a Store</h2>
            <p className="text-sm text-muted-foreground">
              Browse verified merchant stores, add items to your cart, and request delivery.
              A runner will pick up your order and deliver it to you.
            </p>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-left">
              <p className="text-xs text-foreground">
                <span className="font-semibold">Minimum delivery fee is ₦500.</span>{" "}
                Increase the amount if you'd like your errand accepted faster.
              </p>
            </div>
          </div>
          <div className="space-y-2 text-left text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>Browse a store and add items to your cart</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Toggle "Deliver to me" and set a delivery fee</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>A runner picks up your order and delivers it</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">4.</span>
              <span>Confirm delivery — merchant gets item cost, runner gets fee</span>
            </div>
          </div>
          <Button className="w-full gap-2" size="lg" onClick={() => navigate("/merchants?mode=delivery")}>
            <Store className="h-4 w-4" />
            Browse Stores
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostErrandPage;
