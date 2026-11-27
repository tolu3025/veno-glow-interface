import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, ShoppingCart, Loader2, Package, Truck, ShoppingBag, MapPin, Plus, Minus, X, Upload, FileText, Bike } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EmptyState from "@/components/shared/EmptyState";
import { useGeolocation } from "@/hooks/useGeolocation";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { useCampusCoverage } from "@/hooks/useCampusCoverage";
import CartDrawer, { type CartLine } from "@/components/cart/CartDrawer";
import { PasscodePad } from "@/components/shared/PasscodePad";



interface Product {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
  category: string | null;
}

// Products whose `category` triggers a specialised checkout flow instead of
// the generic cart. Keeps the store page useful for merchants with mixed
// catalogs (a "general" store selling both snacks and printing).
const SERVICE_PRODUCT_ROUTES: Record<string, (merchantId: string, productId: string) => string> = {
  printing: (m) => `/services/printing/${m}`,
  stationery: (m) => `/services/printing/${m}`,
  laundry: (m) => `/services/laundry/${m}`,
  project_thesis: (m) => `/services/request?merchant=${m}&type=writing`,
};

const isServiceProduct = (p: Pick<Product, "category">) =>
  !!p.category && p.category in SERVICE_PRODUCT_ROUTES;


const MerchantStorePage = () => {
  const { id: merchantId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deliveryMode = searchParams.get("mode") === "delivery";
  const { profile, wallet, user, refreshWallet } = useAuth();
  const { requestLocation } = useGeolocation();
  const { runnerCount } = useCampusCoverage();
  const hasRunner = (runnerCount ?? 0) > 0;
  const [merchant, setMerchant] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [pin, setPin] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fulfillment: pickup | merchant_delivery | runner
  type Fulfillment = "pickup" | "merchant_delivery" | "runner";
  const [fulfillment, setFulfillment] = useState<Fulfillment>(deliveryMode ? "runner" : "pickup");
  const [runnerFee, setRunnerFee] = useState("200");
  const [deliveryZone, setDeliveryZone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [merchantZones, setMerchantZones] = useState<{ id: string; name: string; fee: number }[]>([]);
  const [selectedMerchantZoneId, setSelectedMerchantZoneId] = useState<string>("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Print upload (for is_print_shop merchants)
  const [printFile, setPrintFile] = useState<File | null>(null);
  const [printSpecs, setPrintSpecs] = useState({ copies: "1", paper: "A4", color: "bw", notes: "" });
  const printInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    loadStore();
    supabase.from("errand_zones").select("name").eq("is_active", true).order("name").then(({ data }) => {
      if (data?.length) setZones(data.map((z: any) => z.name));
    });
    supabase.from("merchant_delivery_zones")
      .select("id, name, fee")
      .eq("merchant_id", merchantId!)
      .eq("is_active", true)
      .order("fee")
      .then(({ data }) => {
        const list = (data || []).map((z: any) => ({ id: z.id, name: z.name, fee: Number(z.fee) || 0 }));
        setMerchantZones(list);
        if (list.length && !selectedMerchantZoneId) setSelectedMerchantZoneId(list[0].id);
      });
  }, [merchantId]);

  const loadStore = async () => {
    setLoading(true);
    try {
      const m = await friendlyInvoke<{ merchant?: any }>("manage-merchant", {
        body: { action: "get_merchant", merchant_id: merchantId },
      }, "Couldn't load store. Please try again.");
      if (m?.merchant) setMerchant(m.merchant);
    } catch (e: any) {
      toast.error(e.message);
    }
    const { data } = await supabase
      .from("merchant_products").select("*")
      .eq("merchant_id", merchantId!).eq("is_available", true).order("name");
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const addToCart = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (p && isServiceProduct(p)) {
      const to = SERVICE_PRODUCT_ROUTES[p.category as string](merchantId!, p.id);
      navigate(to);
      return;
    }
    setCart(prev => {
      const next = new Map(prev);
      next.set(productId, (next.get(productId) || 0) + 1);
      return next;
    });
    toast.success("Added to cart");
  };


  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const next = new Map(prev);
      const current = next.get(productId) || 0;
      if (current <= 1) next.delete(productId);
      else next.set(productId, current - 1);
      return next;
    });
  };

  const cartItemCost = Array.from(cart.entries()).reduce((sum, [id, qty]) => {
    const p = products.find(p => p.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const merchantDeliveryFee = merchant?.delivery_fee ?? 0;
  const selectedMerchantZone = merchantZones.find(z => z.id === selectedMerchantZoneId);
  const merchantDeliveryFeeEffective = merchantZones.length > 0
    ? (selectedMerchantZone?.fee ?? 0)
    : merchantDeliveryFee;
  const numDeliveryFee =
    fulfillment === "runner" ? Number(runnerFee || 0) :
    fulfillment === "merchant_delivery" ? merchantDeliveryFeeEffective : 0;
  const cartTotal = cartItemCost + numDeliveryFee;

  const cartItems = Array.from(cart.entries())
    .map(([id, qty]) => ({ product: products.find(p => p.id === id)!, qty }))
    .filter(i => i.product);

  const isPrintShop = !!merchant?.is_print_shop;
  const offersDelivery = !!merchant?.offers_delivery;

  const handleShareLocation = async () => {
    const coords = await requestLocation();
    if (coords) { setLocation(coords); toast.success("Location shared!"); }
  };

  const onPickPrintFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { toast.error("Max file size is 25MB"); return; }
    setPrintFile(f);
  };

  const uploadPrintFile = async (): Promise<string | null> => {
    if (!printFile || !user) return null;
    const safe = printFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("print-uploads").upload(path, printFile, {
      contentType: printFile.type, upsert: false,
    });
    if (error) { toast.error("Couldn't upload print file. Try again."); return null; }
    return path;
  };

  const handlePurchase = async (enteredPin?: string) => {
    const usePin = enteredPin ?? pin;
    if (usePin.length !== 4) return;

    if (isPrintShop && !printFile) {
      toast.error("Please upload the file you want printed");
      return;
    }
    if (fulfillment === "runner") {
      if (!hasRunner) { toast.error("No runner is active on your campus yet"); return; }
      if (numDeliveryFee < 100) { toast.error("Minimum delivery fee is ₦100"); return; }
      if (!deliveryZone) { toast.error("Select a delivery zone"); return; }
    }
    if (fulfillment === "merchant_delivery") {
      if (!offersDelivery) { toast.error("This merchant doesn't offer delivery"); return; }
      if (merchantZones.length > 0 && !selectedMerchantZoneId) {
        toast.error("Select a delivery zone"); return;
      }
      if (!deliveryAddress.trim()) { toast.error("Enter a delivery address"); return; }
    }

    setPurchasing(true);

    let printPath: string | null = null;
    if (isPrintShop) {
      printPath = await uploadPrintFile();
      if (!printPath) { setPurchasing(false); return; }
    }

    try {
      if (fulfillment === "runner") {
        let coords = location;
        if (!coords) {
          coords = await requestLocation();
          if (coords) setLocation(coords);
        }
        if (!coords) {
          toast.error("Please share your delivery location so a runner can find you");
          setPurchasing(false);
          return;
        }
        await friendlyInvoke("manage-errand", {
          body: {
            action: "create_merchant_errand",
            merchant_id: merchantId,
            items: cartItems.map(i => ({ product_id: i.product.id, quantity: i.qty })),
            delivery_fee: numDeliveryFee,
            zone: deliveryZone,
            pin: usePin,
            urgency: "standard",
            requester_lat: coords.lat,
            requester_lng: coords.lng,
            print_file_url: printPath,
            print_specs: isPrintShop ? printSpecs : null,
          },
        });
        toast.success("Delivery order placed! A runner will pick it up 🚀");
      } else {
        let coords = location;
        if (fulfillment === "merchant_delivery" && !coords) {
          coords = await requestLocation();
          if (coords) setLocation(coords);
        }
        const result = await friendlyInvoke<{ order_id?: string }>("manage-merchant", {
          body: {
            action: "purchase_products",
            merchant_id: merchantId,
            items: cartItems.map(i => ({ product_id: i.product.id, quantity: i.qty, name: i.product.name, price: i.product.price })),
            total_amount: cartTotal,
            pin: usePin,
            delivery_method: fulfillment,
            delivery_fee: numDeliveryFee,
            delivery_address: fulfillment === "merchant_delivery"
              ? (selectedMerchantZone ? `[Zone: ${selectedMerchantZone.name}] ${deliveryAddress}` : deliveryAddress)
              : null,
            delivery_location: fulfillment === "merchant_delivery" && coords ? coords : null,
            print_file_url: printPath,
            print_specs: isPrintShop ? printSpecs : null,
          },
        });
        toast.success(
          fulfillment === "merchant_delivery"
            ? "Order placed! The merchant will deliver to you."
            : "Order placed! Pick it up at the store."
        );
        setCheckoutOpen(false);
        setCart(new Map());
        setPin("");
        setPrintFile(null);
        await refreshWallet();
        if (result?.order_id) {
          navigate(`/orders/${result.order_id}/confirmation`, { replace: true });
          return;
        }
        loadStore();
        return;
      }

      setCheckoutOpen(false);
      setCart(new Map());
      setPin("");
      setPrintFile(null);
      await refreshWallet();
      loadStore();
    } catch (e: any) {
      toast.error(e.message || "Order failed");
      setPin("");
    } finally {
      setPurchasing(false);
    }
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="px-5 pt-10 pb-32 space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{merchant?.business_name || "Store"}</h1>
          <p className="text-xs text-muted-foreground truncate">{merchant?.category}</p>
        </div>
        {(() => {
          const count = Array.from(cart.values()).reduce((a, b) => a + b, 0);
          return (
            <button
              type="button"
              onClick={() => count > 0 && setCheckoutOpen(true)}
              disabled={count === 0}
              aria-label={`Open cart (${count} item${count === 1 ? "" : "s"})`}
              className="relative h-10 w-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-40"
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })()}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No products" description="This merchant has no products available." />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p => (
            <Card
              key={p.id}
              className="overflow-hidden cursor-pointer transition hover:border-primary/40"
              onClick={() => setSelectedProduct(p)}
            >
              {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-28 object-cover" />}
              <CardContent className="p-3 space-y-1">
                <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                <p className="font-mono text-primary font-bold">₦{p.price.toLocaleString()}</p>
                {p.quantity > 0 && <p className="text-[10px] text-muted-foreground">{p.quantity} in stock</p>}
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" className="flex-1 mt-1" onClick={() => addToCart(p.id)}>Add</Button>
                  {cart.has(p.id) && (
                    <Button size="sm" variant="outline" className="mt-1" onClick={() => removeFromCart(p.id)}>
                      {cart.get(p.id)}×
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product detail sheet */}
      <Sheet open={!!selectedProduct} onOpenChange={(o) => !o && setSelectedProduct(null)}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl p-0">
          {selectedProduct && (
            <div className="space-y-4">
              {selectedProduct.image_url ? (
                <div className="relative">
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-64 object-cover" />
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-40 bg-muted flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
              <div className="px-5 pb-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                    <Badge variant={selectedProduct.quantity > 0 ? "default" : "secondary"} className="shrink-0">
                      {selectedProduct.quantity > 0 ? `${selectedProduct.quantity} left` : "Out of stock"}
                    </Badge>
                  </div>
                  <p className="font-mono text-2xl font-bold text-primary">
                    ₦{selectedProduct.price.toLocaleString()}
                  </p>
                </div>

                {selectedProduct.description ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Description
                    </p>
                    <p className="text-sm whitespace-pre-wrap text-foreground/90">
                      {selectedProduct.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description provided.</p>
                )}

                {merchant && (
                  <div className="rounded-xl bg-muted/50 p-3 text-xs space-y-0.5">
                    <p className="text-muted-foreground">Sold by</p>
                    <p className="font-semibold text-foreground">{merchant.business_name || "Merchant"}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  {cart.has(selectedProduct.id) ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => removeFromCart(selectedProduct.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="flex-1 text-center font-mono font-bold text-lg">
                        {cart.get(selectedProduct.id)}
                      </span>
                      <Button size="icon" onClick={() => addToCart(selectedProduct.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="flex-1 gap-2"
                      disabled={selectedProduct.quantity === 0}
                      onClick={() => addToCart(selectedProduct.id)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to cart
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout drawer */}
      <CartDrawer
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        title="Checkout"
        lines={cartItems.map(({ product, qty }): CartLine => ({
          id: product.id, name: product.name, price: product.price, qty,
        }))}
        subtotal={cartItemCost}
        onIncrement={(id) => addToCart(id)}
        onDecrement={(id) => removeFromCart(id)}
        onRemove={(id) => setCart(prev => { const n = new Map(prev); n.delete(id); return n; })}
        footer={
          <Button className="w-full h-12 rounded-2xl" onClick={() => handlePurchase()} disabled={purchasing || pin.length !== 4}>
            {purchasing ? <Loader2 className="h-4 w-4 animate-spin" /> :
              fulfillment === "runner" ? `Place delivery order · ₦${cartTotal.toLocaleString()}` :
              fulfillment === "merchant_delivery" ? `Place order · ₦${cartTotal.toLocaleString()}` :
              `Confirm purchase · ₦${cartTotal.toLocaleString()}`}
          </Button>
        }
      >
        <div className="space-y-3">


            {/* Print upload — for stationery / print-shop merchants */}
            {isPrintShop && (
              <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary">
                    File to print
                  </label>
                </div>
                <input
                  ref={printInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onPickPrintFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => printInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {printFile ? printFile.name : "Upload file (PDF, DOC, image — max 25MB)"}
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number" min={1} max={500}
                    placeholder="Copies"
                    value={printSpecs.copies}
                    onChange={e => setPrintSpecs({ ...printSpecs, copies: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Select value={printSpecs.paper} onValueChange={(v) => setPrintSpecs({ ...printSpecs, paper: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A3">A3</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={printSpecs.color} onValueChange={(v) => setPrintSpecs({ ...printSpecs, color: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bw">B&W</SelectItem>
                      <SelectItem value="color">Colour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Notes (e.g. binding, single/double-sided)"
                  rows={2}
                  value={printSpecs.notes}
                  onChange={e => setPrintSpecs({ ...printSpecs, notes: e.target.value })}
                  className="text-xs"
                />
              </div>
            )}

            {/* Fulfillment selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fulfillment
              </label>
              <div className={`grid gap-2 p-1 bg-muted/60 rounded-xl ${offersDelivery && hasRunner ? "grid-cols-3" : offersDelivery || hasRunner ? "grid-cols-2" : "grid-cols-1"}`}>
                <button
                  type="button"
                  onClick={() => setFulfillment("pickup")}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition ${
                    fulfillment === "pickup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <ShoppingBag className={`h-4 w-4 ${fulfillment === "pickup" ? "text-primary" : ""}`} />
                  Pickup
                </button>
                {offersDelivery && (
                  <button
                    type="button"
                    onClick={() => setFulfillment("merchant_delivery")}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition ${
                      fulfillment === "merchant_delivery" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <Bike className={`h-4 w-4 ${fulfillment === "merchant_delivery" ? "text-primary" : ""}`} />
                    Merchant delivery
                  </button>
                )}
                {hasRunner && (
                  <button
                    type="button"
                    onClick={() => setFulfillment("runner")}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition ${
                      fulfillment === "runner" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <Truck className={`h-4 w-4 ${fulfillment === "runner" ? "text-primary" : ""}`} />
                    KukaPay runner
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {fulfillment === "pickup" && "Collect your order at the store. No delivery fee."}
                {fulfillment === "merchant_delivery" && (
                  merchantZones.length > 0
                    ? `The merchant delivers to you. Fee depends on your zone.`
                    : `The merchant delivers to you. Fee ₦${merchantDeliveryFee.toLocaleString()}.`
                )}
                {fulfillment === "runner" && "A KukaPay runner picks up your order and delivers it."}
              </p>
            </div>

            {fulfillment === "merchant_delivery" && (
              <div className="space-y-3 bg-muted/50 rounded-lg p-3">
                {merchantZones.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Delivery zone</label>
                    <Select value={selectedMerchantZoneId} onValueChange={setSelectedMerchantZoneId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select your zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {merchantZones.map(z => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.name} — ₦{z.fee.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Fees are set by the merchant for each area.
                    </p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Delivery address</label>
                  <Textarea
                    placeholder="Hostel / block / room or street address"
                    rows={2}
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button variant="outline" size="sm" className="w-full gap-1" onClick={handleShareLocation}>
                  <MapPin className="h-3 w-3" />
                  {location ? "Location shared ✓" : "Share my location (optional)"}
                </Button>
              </div>
            )}

            {fulfillment === "runner" && (
              <div className="space-y-3 bg-muted/50 rounded-lg p-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Delivery Zone</label>
                  <Select value={deliveryZone} onValueChange={setDeliveryZone}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Runner Fee (₦)</label>
                  <Input type="number" inputMode="numeric" value={runnerFee}
                    onChange={e => setRunnerFee(e.target.value)} className="h-9" />
                  <p className="text-[10px] text-muted-foreground">Runner earns this. Min ₦100</p>
                </div>
                <Button variant="outline" size="sm" className="w-full gap-1" onClick={handleShareLocation}>
                  <MapPin className="h-3 w-3" />
                  {location ? "Location shared ✓" : "Share location"}
                </Button>
              </div>
            )}

            <div className="space-y-1 bg-muted/30 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-mono">₦{cartItemCost.toLocaleString()}</span>
              </div>
              {numDeliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {fulfillment === "merchant_delivery" && selectedMerchantZone
                      ? `Delivery · ${selectedMerchantZone.name}`
                      : "Delivery"}
                  </span>
                  <span className="font-mono">₦{numDeliveryFee.toLocaleString()}</span>
                </div>
              )}
              <hr className="border-border" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="font-mono">₦{cartTotal.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Wallet: ₦{(wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
              {fulfillment === "runner" && (
                <p className="text-[10px] text-primary">
                  💡 Items cost → merchant · Runner fee → runner
                </p>
              )}
            </div>

            {/* Transaction PIN */}
            <div className="pt-2">
              <PasscodePad
                value={pin}
                onChange={setPin}
                length={4}
                title="Enter transaction PIN"
                subtitle="4-digit PIN to authorize this payment"
                onComplete={handlePurchase}
                loading={purchasing}
              />
            </div>

        </div>
      </CartDrawer>

    </div>
  );
};

export default MerchantStorePage;
