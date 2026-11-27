import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Copy, Loader2, Package, Printer, Shirt, ShoppingBag, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Order = {
  id: string;
  order_type: string | null;
  status: string;
  total_amount: number;
  transaction_reference: string | null;
  delivery_method: string | null;
  delivery_address: string | null;
  customer_name: string | null;
  created_at: string;
  merchant_id: string;
  merchants?: { business_name: string; category: string | null } | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700",
  received: "bg-blue-500/15 text-blue-600",
  accepted: "bg-blue-500/15 text-blue-600",
  preparing: "bg-indigo-500/15 text-indigo-700",
  in_progress: "bg-indigo-500/15 text-indigo-700",
  ready: "bg-emerald-500/15 text-emerald-700",
  out_for_delivery: "bg-purple-500/15 text-purple-700",
  delivered: "bg-emerald-600/15 text-emerald-700",
  completed: "bg-emerald-600/15 text-emerald-700",
  cancelled: "bg-destructive/15 text-destructive",
  rejected: "bg-destructive/15 text-destructive",
};

const NEXT_STEPS: Record<string, { icon: any; steps: string[] }> = {
  printing: {
    icon: Printer,
    steps: [
      "The print shop downloads your file",
      "They print your job with your selected specs",
      "You'll get a notification when it's ready",
      "Pick it up — or wait for delivery",
    ],
  },
  laundry: {
    icon: Shirt,
    steps: [
      "The merchant confirms your pickup slot",
      "Your laundry is picked up at the scheduled time",
      "It's washed and processed",
      "Delivered back to you in your delivery window",
    ],
  },
  food: {
    icon: ShoppingBag,
    steps: [
      "The merchant accepts your order",
      "Your items are prepared",
      "You're notified when it's ready",
      "Pickup or delivery as selected",
    ],
  },
};

const friendlyRef = (id: string) => id.slice(0, 8).toUpperCase();

const OrderConfirmationPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("merchant_orders")
        .select("*, merchants(business_name, category)")
        .eq("id", orderId)
        .maybeSingle();
      if (!cancelled) {
        setOrder(data as any);
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel(`order_${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "merchant_orders", filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...(payload.new as any) } : prev));
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orderId, user?.id]);

  const copyRef = () => {
    if (!order) return;
    const ref = order.transaction_reference || friendlyRef(order.id);
    navigator.clipboard.writeText(ref);
    toast.success("Reference copied");
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-5 pt-12 space-y-4">
        <p className="text-sm text-muted-foreground">We couldn't find that order.</p>
        <Button onClick={() => navigate("/", { replace: true })}>Return home</Button>
      </div>
    );
  }

  const orderType = (order.order_type || "food") as keyof typeof NEXT_STEPS;
  const cfg = NEXT_STEPS[orderType] ?? NEXT_STEPS.food;
  const StepIcon = cfg.icon;

  return (
    <div className="px-5 pt-12 pb-12 space-y-5 max-w-md mx-auto">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold">Order placed</h1>
        <p className="text-sm text-muted-foreground">
          Payment held in escrow until your order is fulfilled.
        </p>
      </div>

      <Card className="rounded-2xl border-0 shadow-soft">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Order reference</p>
              <p className="font-mono font-semibold text-sm break-all">
                {order.transaction_reference || friendlyRef(order.id)}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={copyRef} className="gap-1 h-8">
              <Copy className="h-3 w-3" /> Copy
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Merchant</p>
              <p className="text-sm font-medium">{order.merchants?.business_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <Badge variant="outline" className="capitalize mt-0.5">{orderType}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total paid</p>
              <p className="text-sm font-bold font-mono">₦{Number(order.total_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className={`${STATUS_STYLES[order.status] || ""} capitalize mt-0.5`}>
                {order.status.replaceAll("_", " ")}
              </Badge>
            </div>
            {order.delivery_method && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Fulfillment</p>
                <p className="text-sm capitalize">{order.delivery_method.replaceAll("_", " ")}</p>
                {order.delivery_address && (
                  <p className="text-xs text-muted-foreground mt-0.5">{order.delivery_address}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-soft">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <StepIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">What happens next</h2>
          </div>
          <ol className="space-y-2">
            {cfg.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="h-5 w-5 mt-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Package className="h-4 w-4 text-primary mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Your funds are held safely. The merchant only gets paid once you confirm delivery.
            We'll notify you on every status update.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button variant="outline" className="h-12 rounded-2xl" onClick={() => navigate("/", { replace: true })}>
          Return home
        </Button>
        <Button className="h-12 rounded-2xl gap-1" onClick={() => navigate(`/orders/${order.id}`)}>
          Track order <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
