import { useState, useEffect } from "react";
import { Store, CheckCircle, XCircle, Loader2, Search, Eye, Package, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getFunctionErrorMessage, invokeAdminOperation } from "@/lib/admin-functions";

interface Merchant {
  id: string;
  business_name: string;
  category: string;
  status: string;
  total_revenue: number;
  total_transactions: number;
  user_id: string;
  created_at: string;
  qr_code: string;
  description: string | null;
  logo_url: string | null;
  commission_rate: number;
  settlement_bank_name: string | null;
  settlement_account_number: string | null;
  settlement_account_name: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  active: "bg-accent/10 text-accent",
  suspended: "bg-destructive/10 text-destructive",
};

const AdminMerchantsPage = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [merchantProducts, setMerchantProducts] = useState<any[]>([]);
  const [merchantOrders, setMerchantOrders] = useState<any[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchMerchants(); }, [filter]);

  const fetchMerchants = async () => {
    setLoading(true);
    const { data, error } = await invokeAdminOperation({ action: "get_merchants", statusFilter: filter });
    if (data?.success) setMerchants(data.merchants || []);
    else toast.error(getFunctionErrorMessage(data, error, "Failed to load merchants"));
    setLoading(false);
  };

  const openDetail = async (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setDetailLoading(true);
    const [productsRes, ordersRes, profileRes] = await Promise.all([
      supabase.from("merchant_products").select("*").eq("merchant_id", merchant.id).order("created_at", { ascending: false }),
      supabase.from("merchant_orders").select("*").eq("merchant_id", merchant.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("full_name").eq("id", merchant.user_id).single(),
    ]);
    setMerchantProducts(productsRes.data || []);
    setMerchantOrders(ordersRes.data || []);
    setOwnerName(profileRes.data?.full_name || "Unknown");
    setDetailLoading(false);
  };

  const updateStatus = async (merchantId: string, action: "approve_merchant" | "suspend_merchant") => {
    setActionLoading(merchantId);
    const { data, error } = await invokeAdminOperation({ action, merchantId });
    setActionLoading(null);
    if (data?.success) {
      toast.success(action === "approve_merchant" ? "Merchant approved" : "Merchant suspended");
      fetchMerchants();
      setSelectedMerchant(null);
    } else {
      toast.error(getFunctionErrorMessage(data, error, "Action failed"));
    }
  };

  const filtered = merchants.filter((m) =>
    !search || m.business_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Merchants</h2>
        <Badge variant="secondary">{merchants.length} total</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search merchants..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {["all", "pending", "active", "suspended"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Merchant Detail Sheet */}
      <Sheet open={!!selectedMerchant} onOpenChange={(open) => !open && setSelectedMerchant(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedMerchant?.business_name}</SheetTitle>
          </SheetHeader>
          {selectedMerchant && (
            <div className="mt-4 space-y-4">
              {detailLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : (
                <>
                  {/* Store Info */}
                  <Card>
                    <CardContent className="p-4 space-y-2 text-sm">
                      <div className="flex items-center gap-3 mb-3">
                        {selectedMerchant.logo_url ? (
                          <img src={selectedMerchant.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Store className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{selectedMerchant.business_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{selectedMerchant.category}</p>
                        </div>
                        <Badge className={`ml-auto text-[10px] ${STATUS_COLORS[selectedMerchant.status] || ""}`}>
                          {selectedMerchant.status}
                        </Badge>
                      </div>
                      {selectedMerchant.description && (
                        <p className="text-muted-foreground text-xs">{selectedMerchant.description}</p>
                      )}
                      <Separator />
                      <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-medium">{ownerName}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-mono font-bold">₦{Number(selectedMerchant.total_revenue).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Transactions</span><span>{selectedMerchant.total_transactions}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Commission</span><span>{selectedMerchant.commission_rate}%</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">QR Code</span><span className="font-mono text-xs">{selectedMerchant.qr_code.slice(0, 16)}...</span></div>
                      {selectedMerchant.settlement_bank_name && (
                        <>
                          <Separator />
                          <p className="text-xs font-semibold text-muted-foreground">Settlement</p>
                          <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span>{selectedMerchant.settlement_bank_name}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-mono">{selectedMerchant.settlement_account_number}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{selectedMerchant.settlement_account_name}</span></div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Products */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Package className="h-4 w-4" /> Products ({merchantProducts.length})
                    </h3>
                    {merchantProducts.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No products listed</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {merchantProducts.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              {p.image_url ? (
                                <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                              ) : (
                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-medium">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground">Qty: {p.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono font-bold">₦{Number(p.price).toLocaleString()}</p>
                              <Badge variant={p.is_available ? "default" : "secondary"} className="text-[9px]">
                                {p.is_available ? "Available" : "Unavailable"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Orders */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <ShoppingCart className="h-4 w-4" /> Recent Orders ({merchantOrders.length})
                    </h3>
                    {merchantOrders.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No orders yet</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {merchantOrders.map((o) => (
                          <div key={o.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-xs font-medium">{o.customer_name}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono font-bold">₦{Number(o.total_amount).toLocaleString()}</p>
                              <Badge variant="secondary" className="text-[9px] capitalize">{o.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {selectedMerchant.status === "pending" && (
                      <Button size="sm" className="flex-1 gap-1" onClick={() => updateStatus(selectedMerchant.id, "approve_merchant")}
                        disabled={actionLoading === selectedMerchant.id}>
                        {actionLoading === selectedMerchant.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Approve
                      </Button>
                    )}
                    {selectedMerchant.status === "active" && (
                      <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => updateStatus(selectedMerchant.id, "suspend_merchant")}
                        disabled={actionLoading === selectedMerchant.id}>
                        {actionLoading === selectedMerchant.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                        Suspend
                      </Button>
                    )}
                    {selectedMerchant.status === "suspended" && (
                      <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => updateStatus(selectedMerchant.id, "approve_merchant")}
                        disabled={actionLoading === selectedMerchant.id}>
                        {actionLoading === selectedMerchant.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Reactivate
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No merchants found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card key={m.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => openDetail(m)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{m.business_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{m.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${STATUS_COLORS[m.status] || ""}`}>
                      {m.status}
                    </Badge>
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Revenue: ₦{Number(m.total_revenue).toLocaleString()}</span>
                  <span>{m.total_transactions} txns</span>
                  <span>{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMerchantsPage;
