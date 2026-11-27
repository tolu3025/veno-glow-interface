import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Package, Clock, CheckCircle, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { toast } from "sonner";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  items: any[];
  customer_name: string;
  created_at: string;
}

const MerchantOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await friendlyInvoke<any>("manage-merchant", {
        body: { action: "get_my_merchant" },
      }, "Failed to load merchant");
      if (res?.merchant) {
        setMerchantId(res.merchant.id);
        const data = await friendlyInvoke<any>("manage-merchant", {
          body: { action: "get_orders", merchant_id: res.merchant.id },
        }, "Failed to load orders");
        setOrders((data?.orders as Order[]) || []);
      }
    } catch {
      /* silent — empty state will render */
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await friendlyInvoke("manage-merchant", {
        body: { action: "update_order_status", order_id: orderId, status },
      }, "Failed to update order");
      toast.success(`Order ${status}`);
      loadOrders();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "pending": return "bg-yellow-500/15 text-yellow-600";
      case "in_progress": return "bg-primary/15 text-primary";
      case "completed": return "bg-accent/15 text-accent";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filterOrders = (status: string) => status === "all" ? orders : orders.filter(o => o.status === status);

  if (loading) {
    return <div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="px-5 pt-10 pb-24 space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/merchants/dashboard")}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-bold">Orders</h1>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">Active</TabsTrigger>
          <TabsTrigger value="completed">Done</TabsTrigger>
        </TabsList>

        {["pending", "in_progress", "completed"].map(status => (
          <TabsContent key={status} value={status} className="space-y-3">
            {filterOrders(status).length === 0 ? (
              <EmptyState icon={Package} title={`No ${status.replace("_", " ")} orders`} description="" />
            ) : (
              filterOrders(status).map(order => (
                <Card key={order.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{order.customer_name}</p>
                      <Badge className={`text-[10px] border-0 ${statusColor(order.status)}`}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {(order.items || []).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span>{item.name} × {item.quantity}</span>
                          <span className="font-mono-num">₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, h:mm a")}
                      </span>
                      <span className="font-mono-num font-bold text-sm">₦{order.total_amount.toLocaleString()}</span>
                    </div>
                    {order.status === "pending" && (
                      <Button size="sm" className="w-full gap-1" onClick={() => updateStatus(order.id, "in_progress")} disabled={updating === order.id}>
                        {updating === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        Start Order
                      </Button>
                    )}
                    {order.status === "in_progress" && (
                      <Button size="sm" className="w-full gap-1" onClick={() => updateStatus(order.id, "completed")} disabled={updating === order.id}>
                        {updating === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Mark Completed
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MerchantOrdersPage;
