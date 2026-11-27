import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Copy, Loader2, Phone, Printer, Shirt, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import KukaPayLoader from "@/components/shared/KukaPayLoader";
import EmptyState from "@/components/shared/EmptyState";

type Order = {
  id: string;
  order_type: string | null;
  status: string;
  total_amount: number;
  transaction_reference: string | null;
  delivery_method: string | null;
  delivery_address: string | null;
  customer_name: string | null;
  special_instructions?: string | null;
  created_at: string;
  updated_at?: string | null;
  merchant_id: string;
  merchants?: { business_name: string; category: string | null; phone_number?: string | null } | null;
};

const TIMELINES: Record<string, { key: string; label: string }[]> = {
  food: [
    { key: "received", label: "Order received" },
    { key: "accepted", label: "Merchant accepted" },
    { key: "preparing", label: "Preparing your order" },
    { key: "ready", label: "Ready" },
    { key: "out_for_delivery", label: "Out for delivery" },
    { key: "delivered", label: "Delivered" },
  ],
  printing: [
    { key: "received", label: "Order received" },
    { key: "accepted", label: "Print shop accepted" },
    { key: "in_progress", label: "Printing in progress" },
    { key: "ready", label: "Ready for pickup / delivery" },
    { key: "delivered", label: "Delivered" },
  ],
  laundry: [
    { key: "received", label: "Order received" },
    { key: "accepted", label: "Merchant confirmed" },
    { key: "picked_up", label: "Picked up" },
    { key: "in_progress", label: "Washing & processing" },
    { key: "ready", label: "Ready" },
    { key: "delivered", label: "Delivered back to you" },
  ],
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700",
  received: "bg-blue-500/15 text-blue-600",
  accepted: "bg-blue-500/15 text-blue-600",
  preparing: "bg-indigo-500/15 text-indigo-700",
  in_progress: "bg-indigo-500/15 text-indigo-700",
  picked_up: "bg-indigo-500/15 text-indigo-700",
  ready: "bg-emerald-500/15 text-emerald-700",
  out_for_delivery: "bg-purple-500/15 text-purple-700",
  delivered: "bg-emerald-600/15 text-emerald-700",
  completed: "bg-emerald-600/15 text-emerald-700",
  cancelled: "bg-destructive/15 text-destructive",
  rejected: "bg-destructive/15 text-destructive",
};

const friendlyRef = (id: string) => id.slice(0, 8).toUpperCase();

const OrderTrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let attempts = 0;

    const loadOnce = async () => {
      const { data } = await supabase
        .from("merchant_orders")
        .select("*, merchants(business_name, category, phone_number)")
        .eq("id", orderId)
        .maybeSingle();
      return data as Order | null;
    };

    const load = async () => {
      // Poll up to ~9s to cover replication lag between the checkout RPC and RLS-visible read.
      while (!cancelled && attempts < 6) {
        const data = await loadOnce();
        if (data) {
          if (!cancelled) {
            setOrder(data);
            setLoading(false);
          }
          return;
        }
        attempts += 1;
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`track_order_${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "merchant_orders", filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...(payload.new as any) } : (payload.new as any)));
          const next = (payload.new as any)?.status;
          if (next) toast.success(`Status updated: ${String(next).replaceAll("_", " ")}`);
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <KukaPayLoader isLoading />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-5 pt-12 space-y-3">
        <EmptyState
          icon={ShoppingBag}
          title="No order to track yet"
          description="We couldn't find that order. It may still be syncing — try again in a moment, or check your transactions."
        />
        <Button className="w-full" onClick={() => navigate("/", { replace: true })}>
          Back to home
        </Button>
        <Button className="w-full" variant="outline" onClick={() => navigate("/transactions")}>
          View transactions
        </Button>
      </div>
    );
  }

  const orderType = (order.order_type || "food") as keyof typeof TIMELINES;
  const timeline = TIMELINES[orderType] ?? TIMELINES.food;
  const currentIdx = Math.max(
    0,
    timeline.findIndex((s) => s.key === order.status),
  );
  const CategoryIcon = orderType === "printing" ? Printer : orderType === "laundry" ? Shirt : ShoppingBag;
  const terminal = ["delivered", "completed", "cancelled", "rejected"].includes(order.status);

  const copyRef = () => {
    const ref = order.transaction_reference || friendlyRef(order.id);
    navigator.clipboard.writeText(ref);
    toast.success("Reference copied");
  };

  return (
    <div className="px-5 pt-10 pb-16 space-y-5 max-w-md mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <CategoryIcon className="h-4 w-4 text-primary" />
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Track order</p>
        </div>
        <h1 className="text-xl font-bold">{order.merchants?.business_name || "Your order"}</h1>
        <Badge className={`${STATUS_STYLES[order.status] || ""} capitalize`}>
          {order.status.replaceAll("_", " ")}
        </Badge>
      </header>

      <Card className="rounded-2xl border-0 shadow-soft">
        <CardContent className="p-4">
          <ol className="relative space-y-4">
            {timeline.map((step, i) => {
              const done = !terminal ? i <= currentIdx : step.key === order.status || i < currentIdx;
              const active = !terminal && i === currentIdx;
              return (
                <li key={step.key} className="flex items-start gap-3">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                      done ? "bg-emerald-500 text-white" : active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : <span className="text-[11px] font-bold">{i + 1}</span>}
                  </div>
                  <div className="pt-1">
                    <p className={`text-sm ${active ? "font-semibold" : done ? "" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {active && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">In progress</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-soft">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Reference</p>
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
              <p className="text-xs text-muted-foreground">Total paid</p>
              <p className="text-sm font-bold font-mono">₦{Number(order.total_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Placed</p>
              <p className="text-sm">{new Date(order.created_at).toLocaleString()}</p>
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
            {order.special_instructions && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Instructions</p>
                <p className="text-sm">{order.special_instructions}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        {order.merchants?.phone_number ? (
          <Button
            variant="outline"
            className="h-12 rounded-2xl gap-1"
            onClick={() => (window.location.href = `tel:${order.merchants?.phone_number}`)}
          >
            <Phone className="h-4 w-4" /> Merchant
          </Button>
        ) : (
          <Button variant="outline" className="h-12 rounded-2xl" onClick={() => navigate("/", { replace: true })}>
            Home
          </Button>
        )}
        <Button className="h-12 rounded-2xl" onClick={() => navigate("/transactions")}>
          Transactions
        </Button>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
