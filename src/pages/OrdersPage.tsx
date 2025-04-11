
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingBag, Package, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  created_at: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  product: {
    title: string;
    category: string;
  };
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData?.user) {
          toast({
            title: "Authentication required",
            description: "Please sign in to view your orders",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            product_id,
            quantity,
            total_amount,
            status,
            products (
              title,
              category
            )
          `)
          .eq('buyer_id', userData.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          toast({
            title: "Failed to load orders",
            description: error.message,
            variant: "destructive"
          });
        } else {
          setOrders(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        toast({
          title: "Failed to load orders",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-3">Loading Orders</h1>
          <p className="text-muted-foreground">Please wait while we fetch your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Your Orders</h1>
          <p className="text-muted-foreground">
            Track and manage your purchases from Veno Marketplace
          </p>
        </div>

        <Separator />

        {orders.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <ShoppingBag className="h-16 w-16 text-muted" />
              <h2 className="text-2xl font-semibold">No orders yet</h2>
              <p className="text-muted-foreground">
                You haven't placed any orders from Veno Marketplace yet.
              </p>
              <div className="mt-4">
                <a href="/marketplace" className="text-primary hover:underline">
                  Browse Products
                </a>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Orders Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <div className="text-2xl font-bold">{orders.length}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending Delivery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div className="text-2xl font-bold">
                      {orders.filter(order => 
                        order.status === 'pending' || order.status === 'processing'
                      ).length}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <div className="text-2xl font-bold">
                      {orders.filter(order => order.status === 'completed').length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount (₦)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{order.product?.title || "Product unavailable"}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.product?.category || "Unknown category"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>{order.total_amount.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
