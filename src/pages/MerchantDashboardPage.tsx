import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode, TrendingUp, Clock, DollarSign, Store, Loader2, Copy, Share2, ShoppingBag, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const MerchantDashboardPage = () => {
  const navigate = useNavigate();
  const { requestLocation, loading: locLoading } = useGeolocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingLoc, setSavingLoc] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await friendlyInvoke<any>("manage-merchant", {
        body: { action: "get_my_merchant" },
      }, "Could not load merchant dashboard");
      setData(res);
    } catch (err: any) {
      if (/no merchant/i.test(err.message)) {
        navigate("/merchants/onboard");
        return;
      }
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };


  const copyQR = () => {
    if (data?.merchant?.qr_code) {
      navigator.clipboard.writeText(data.merchant.qr_code);
      toast.success("QR code copied!");
    }
  };

  const saveLocation = async () => {
    setSavingLoc(true);
    const coords = await requestLocation();
    if (!coords) {
      setSavingLoc(false);
      toast.error("Could not get your location. Please allow access and retry.");
      return;
    }
    try {
      await friendlyInvoke("manage-merchant", {
        body: { action: "update_location", latitude: coords.lat, longitude: coords.lng },
      }, "Failed to save location");
      toast.success("Pickup location updated!");
      loadDashboard();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingLoc(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { merchant, transactions, stats } = data;

  // Build chart data from transactions (last 7 days)
  const chartData: { day: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en", { weekday: "short" });
    const dayTxns = (transactions || []).filter((t: any) => t.created_at.startsWith(key));
    chartData.push({ day: label, revenue: dayTxns.reduce((s: number, t: any) => s + Number(t.net_amount), 0) });
  }

  return (
    <div className="px-5 pt-10 pb-4 space-y-5">
      <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{merchant.business_name}</h1>
          <Badge variant={merchant.status === "active" ? "default" : "secondary"} className="text-[10px] mt-1">
            {merchant.status}
          </Badge>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
          <Store className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="font-mono-num text-lg font-bold">₦{stats.todayRevenue.toLocaleString("en-NG")}</p>
            <p className="text-[10px] text-muted-foreground">{stats.todayCount} txns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">This Week</p>
            <p className="font-mono-num text-lg font-bold">₦{stats.weekRevenue.toLocaleString("en-NG")}</p>
            <p className="text-[10px] text-muted-foreground">{stats.weekCount} txns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="font-mono-num text-lg font-bold">₦{stats.monthRevenue.toLocaleString("en-NG")}</p>
            <p className="text-[10px] text-muted-foreground">{stats.monthCount} txns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">All Time</p>
            <p className="font-mono-num text-lg font-bold">₦{Number(merchant.total_revenue).toLocaleString("en-NG")}</p>
            <p className="text-[10px] text-muted-foreground">{merchant.total_transactions} txns</p>
          </CardContent>
        </Card>
      </div>

      {/* Store Setup Prompt */}
      {stats.productCount === 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-2 text-center">
            <ShoppingBag className="h-8 w-8 mx-auto text-primary" />
            <h3 className="font-bold text-sm">Set Up Your Store</h3>
            <p className="text-xs text-muted-foreground">Add products so customers can browse and order from your store.</p>
            <Button size="sm" className="gap-1" onClick={() => navigate("/merchants/products")}>
              <Plus className="h-3.5 w-3.5" /> Add Your First Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pickup location */}
      <Card className={merchant.latitude && merchant.longitude ? "" : "border-primary/30 bg-primary/5"}>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Pickup location</h3>
          </div>
          {merchant.latitude && merchant.longitude ? (
            <p className="text-xs text-muted-foreground">
              Saved at <span className="font-mono">{Number(merchant.latitude).toFixed(5)}, {Number(merchant.longitude).toFixed(5)}</span>. Runners see this as the pickup pin on the delivery map.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Save your store's location so it appears on the runner's map for every delivery order.
            </p>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={saveLocation} disabled={savingLoc || locLoading}>
            {(savingLoc || locLoading) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            {merchant.latitude ? "Update location" : "Share location"}
          </Button>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/merchants/products")}>
          Products {stats.productCount > 0 && `(${stats.productCount})`}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/merchants/orders")}>
          Orders
        </Button>
        {merchant?.id && (
          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/merchants/store/${merchant.id}`)}>
            My Store
          </Button>
        )}
      </div>

      <Tabs defaultValue="analytics">
        <TabsList className="w-full">
          <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
          <TabsTrigger value="qr" className="flex-1">QR Code</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Revenue (Last 7 Days)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Commission Paid</p>
              <p className="font-mono-num text-lg font-bold">₦{stats.totalCommission.toLocaleString("en-NG")}</p>
              <p className="text-[10px] text-muted-foreground">{merchant.commission_rate}% per transaction</p>
            </CardContent>
          </Card>
          {merchant.settlement_bank_name && (
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Settlement Account</p>
                <p className="text-sm font-medium">{merchant.settlement_account_name}</p>
                <p className="font-mono-num text-sm">{merchant.settlement_account_number}</p>
                <p className="text-xs text-muted-foreground">{merchant.settlement_bank_name}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardContent className="p-6 flex flex-col items-center space-y-4">
              <div className="bg-background p-4 rounded-2xl border-2 border-muted">
                <QRCodeSVG value={merchant.qr_code} size={200} />
              </div>
              <p className="font-mono-num text-sm font-bold">{merchant.qr_code}</p>
              <p className="text-xs text-muted-foreground text-center">
                Show this QR code to customers or share your merchant code for them to pay you.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyQR} className="gap-1">
                  <Copy className="h-3.5 w-3.5" /> Copy Code
                </Button>
                <Button size="sm" className="gap-1" onClick={() => {
                  const text = `Pay me on Kuka Pay!\n\nMerchant: ${merchant.business_name}\nCode: ${merchant.qr_code}`;
                  if (navigator.share) navigator.share({ title: merchant.business_name, text });
                  else { navigator.clipboard.writeText(text); toast.success("Copied!"); }
                }}>
                  <Share2 className="h-3.5 w-3.5" /> Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-2">
          {(!transactions || transactions.length === 0) ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No transactions yet</CardContent></Card>
          ) : (
            transactions.map((t: any) => (
              <Card key={t.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Payment received</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-num text-sm font-bold text-accent">+₦{Number(t.net_amount).toLocaleString("en-NG")}</p>
                    <p className="text-[10px] text-muted-foreground font-mono-num">-₦{Number(t.commission_amount).toLocaleString()} fee</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MerchantDashboardPage;
