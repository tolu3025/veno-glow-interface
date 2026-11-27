import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PasscodePad } from "@/components/shared/PasscodePad";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import KukaPayLoader from "@/components/shared/KukaPayLoader";
import {
  computeLaundryTotal, DEFAULT_LAUNDRY_PRICING,
  LAUNDRY_ITEM_LABELS, LAUNDRY_SERVICE_LABELS,
  type LaundryCart, type LaundryPricing, type LaundryServiceType,
} from "@/lib/pricing";

const LaundryCheckoutPage = () => {
  const { merchantId } = useParams<{ merchantId: string }>();
  const navigate = useNavigate();
  const { user, profile, wallet, refreshWallet } = useAuth();

  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<LaundryCart>({});
  const [service, setService] = useState<LaundryServiceType>("wash_and_iron");
  const [pickup, setPickup] = useState<"self" | "pickup_and_delivery">("self");
  const [address, setAddress] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!merchantId) return;
    supabase.from("merchants").select("*").eq("id", merchantId).maybeSingle()
      .then(({ data }) => { setMerchant(data); setLoading(false); });
  }, [merchantId]);

  const pricing: LaundryPricing = (merchant?.laundry_pricing ?? DEFAULT_LAUNDRY_PRICING);
  const items = { ...DEFAULT_LAUNDRY_PRICING.items, ...(pricing.items ?? {}) };
  const subtotal = useMemo(() => computeLaundryTotal(cart, service, pricing), [cart, service, pricing]);
  const deliveryFee = pickup === "pickup_and_delivery"
    ? (pricing.pickup_delivery_fee ?? 500) : 0;
  const total = subtotal + deliveryFee;
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const balance = wallet?.balance ?? 0;
  const canSubmit = itemCount > 0 && total > 0 &&
    (pickup === "self" || (address.trim().length > 3 && pickupTime && deliveryTime));

  const inc = (k: string) => setCart({ ...cart, [k]: (cart[k] ?? 0) + 1 });
  const dec = (k: string) => {
    const next = (cart[k] ?? 0) - 1;
    const c = { ...cart };
    if (next <= 0) delete c[k]; else c[k] = next;
    setCart(c);
  };

  const handleCheckout = () => {
    if (balance < total) { toast.error("Insufficient balance."); return; }
    setPinOpen(true);
  };

  const submitOrder = async (enteredPin?: string) => {
    if (!user || !merchantId) return;
    const usePin = enteredPin ?? pin;
    if (usePin.length !== 4) return;
    setPaying(true);
    try {
      const { data: pinRes, error: pinErr } = await supabase.functions.invoke("verify-transaction-pin", {
        body: { pin: usePin },
      });
      if (pinErr || !(pinRes as any)?.success) {
        const err = (pinRes as any)?.error;
        if (err === "no_pin_set") throw new Error("Set your transaction PIN first from Profile > Security.");
        throw new Error(err || "Incorrect PIN");
      }

      const laundryItemsPayload = Object.entries(cart).map(([key, qty]) => ({
        key, label: LAUNDRY_ITEM_LABELS[key] ?? key, qty, unit_price: items[key] ?? 0,
      }));

      const { data, error } = await supabase.rpc("create_instant_order", {
        p_merchant_id: merchantId,
        p_order_type: "laundry",
        p_total: subtotal,
        p_delivery_fee: deliveryFee,
        p_delivery_method: pickup === "self" ? "pickup" : "merchant_delivery",
        p_delivery_address: pickup === "pickup_and_delivery" ? address : "",
        p_delivery_zone_name: "",
        p_items: [],
        p_print_specs: {} as any,
        p_print_file_url: "",
        p_print_file_name: "",
        p_laundry_items: laundryItemsPayload as any,
        p_service_type: service,
        p_pickup_window: pickup === "pickup_and_delivery" ? { time: pickupTime } as any : {} as any,
        p_delivery_window: pickup === "pickup_and_delivery" ? { time: deliveryTime } as any : {} as any,
        p_special_instructions: notes || "",
        p_customer_name: profile?.full_name ?? "Customer",
      } as any);
      if (error) throw error;
      const res = data as any;
      if (!res?.success) throw new Error(res?.error || "Order failed");

      toast.success("Laundry order placed!");
      await refreshWallet();
      navigate(`/orders/${res.order_id}/confirmation`, { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Could not place order");
    } finally {
      setPaying(false);
      setPin("");
      setPinOpen(false);
    }
  };

  if (loading) return <KukaPayLoader isLoading />;
  if (!merchant) return <div className="p-6">Vendor not found.</div>;

  return (
    <div className="px-5 pt-12 pb-32 space-y-5">
      <header className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="press-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-bold leading-tight">{merchant.business_name}</h1>
          <p className="text-[12px] text-muted-foreground">Laundry checkout</p>
        </div>
      </header>

      {/* Items */}
      <Card className="rounded-2xl border-0 shadow-soft">
        <CardContent className="p-4 space-y-3">
          <Label>What are you bringing?</Label>
          <div className="space-y-2">
            {Object.entries(items).map(([k, price]) => (
              <div key={k} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{LAUNDRY_ITEM_LABELS[k] ?? k}</p>
                  <p className="text-[11px] text-muted-foreground">₦{price.toLocaleString()} base</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-full"
                    onClick={() => dec(k)} disabled={!cart[k]}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{cart[k] ?? 0}</span>
                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => inc(k)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service type */}
      <Card className="rounded-2xl border-0 shadow-soft">
        <CardContent className="p-4 space-y-3">
          <Label>Service</Label>
          <Select value={service} onValueChange={(v) => setService(v as LaundryServiceType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(LAUNDRY_SERVICE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Pickup */}
      <Card className="rounded-2xl border-0 shadow-soft">
        <CardContent className="p-4 space-y-3">
          <Label>Pickup option</Label>
          <RadioGroup value={pickup} onValueChange={(v) => setPickup(v as any)} className="grid grid-cols-2 gap-2">
            <label className={`p-3 rounded-xl border ${pickup==='self'?'border-primary bg-primary/5':'border-border'}`}>
              <RadioGroupItem value="self" className="hidden" />
              <p className="font-medium text-sm">Self drop-off</p>
              <p className="text-[11px] text-muted-foreground">Free</p>
            </label>
            <label className={`p-3 rounded-xl border ${pickup==='pickup_and_delivery'?'border-primary bg-primary/5':'border-border'}`}>
              <RadioGroupItem value="pickup_and_delivery" className="hidden" />
              <p className="font-medium text-sm">Pickup + delivery</p>
              <p className="text-[11px] text-muted-foreground">+₦{(pricing.pickup_delivery_fee ?? 500).toLocaleString()}</p>
            </label>
          </RadioGroup>
          {pickup === "pickup_and_delivery" && (
            <div className="space-y-2">
              <Input placeholder="Hostel / address" value={address} onChange={(e) => setAddress(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px]">Pickup time</Label>
                  <Input type="datetime-local" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                </div>
                <div>
                  <Label className="text-[11px]">Delivery time</Label>
                  <Input type="datetime-local" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <Textarea placeholder="Special instructions (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="rounded-2xl border-0 shadow-soft bg-primary/5">
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{itemCount} item{itemCount===1?'':'s'} · {LAUNDRY_SERVICE_LABELS[service]}</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          {deliveryFee > 0 && <div className="flex justify-between"><span>Pickup + delivery</span><span>₦{deliveryFee.toLocaleString()}</span></div>}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
            <span>Total</span><span>₦{total.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Wallet balance: ₦{balance.toLocaleString()}</p>
        </CardContent>
      </Card>

      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 p-4 bg-background/95 backdrop-blur border-t md:bottom-0">
        <Button onClick={handleCheckout} disabled={!canSubmit} className="w-full h-12 rounded-2xl text-base">
          Pay ₦{total.toLocaleString()}
        </Button>
      </div>

      <Sheet open={pinOpen} onOpenChange={(o) => !paying && setPinOpen(o)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader><SheetTitle>Enter transaction PIN</SheetTitle></SheetHeader>
          <div className="pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              ₦{total.toLocaleString()} held in escrow until your laundry is delivered.
            </p>
            <PasscodePad value={pin} onChange={setPin} length={4} onComplete={submitOrder} loading={paying} />
            <Button onClick={() => submitOrder()} disabled={pin.length !== 4 || paying} className="w-full h-12 rounded-2xl">
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm payment"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LaundryCheckoutPage;
