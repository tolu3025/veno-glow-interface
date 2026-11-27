import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, FileText, X, Loader2 } from "lucide-react";
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
  computePrintingTotal, DEFAULT_PRINTING_PRICING,
  type PrintSpecs, type PrintingPricing,
} from "@/lib/pricing";

const MAX_FILE_MB = 25;
const ACCEPTED = ".pdf,.doc,.docx,.jpg,.jpeg,.png";

const PrintingCheckoutPage = () => {
  const { merchantId } = useParams<{ merchantId: string }>();
  const navigate = useNavigate();
  const { user, profile, wallet, refreshWallet } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [specs, setSpecs] = useState<PrintSpecs>({
    color: "bw", paper: "a4", sides: "single", copies: 1, pages: 1,
    binding: "none", urgency: "standard",
  });
  const [delivery, setDelivery] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!merchantId) return;
    supabase.from("merchants").select("*").eq("id", merchantId).maybeSingle()
      .then(({ data }) => { setMerchant(data); setLoading(false); });
  }, [merchantId]);

  const pricing: PrintingPricing = (merchant?.printing_pricing ?? DEFAULT_PRINTING_PRICING);
  const subtotal = useMemo(() => computePrintingTotal(specs, pricing), [specs, pricing]);
  const deliveryFee = delivery === "delivery" ? (pricing.delivery_fee ?? merchant?.delivery_fee ?? 300) : 0;
  const total = subtotal + deliveryFee;
  const balance = wallet?.balance ?? 0;
  const canSubmit = !!file && specs.pages > 0 && specs.copies > 0 && total > 0 && (delivery === "pickup" || address.trim().length > 3);

  const onPickFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_FILE_MB}MB.`);
      return;
    }
    setFile(f);
  };

  const handleCheckout = async () => {
    if (!user || !file || !merchantId) return;
    if (balance < total) {
      toast.error("Insufficient balance. Top up your wallet.");
      return;
    }
    setPinOpen(true);
  };

  const submitOrder = async (enteredPin?: string) => {
    if (!user || !file || !merchantId) return;
    const usePin = enteredPin ?? pin;
    if (usePin.length !== 4) return;
    setPaying(true);
    try {
      // Verify transaction PIN
      const { data: pinRes, error: pinErr } = await supabase.functions.invoke("verify-transaction-pin", {
        body: { pin: usePin },
      });
      if (pinErr || !(pinRes as any)?.success) {
        const err = (pinRes as any)?.error;
        if (err === "no_pin_set") {
          throw new Error("Set your transaction PIN first from Profile > Security.");
        }
        throw new Error(err || "Incorrect PIN");
      }

      // Upload file
      setUploading(true);
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("print-files").upload(path, file, {
        upsert: false, contentType: file.type || "application/octet-stream",
      });
      if (upErr) throw upErr;
      setUploading(false);

      const { data, error } = await supabase.rpc("create_instant_order", {
        p_merchant_id: merchantId,
        p_order_type: "printing",
        p_total: subtotal,
        p_delivery_fee: deliveryFee,
        p_delivery_method: delivery === "pickup" ? "pickup" : "merchant_delivery",
        p_delivery_address: delivery === "delivery" ? address : "",
        p_delivery_zone_name: "",
        p_items: [],
        p_print_specs: specs as any,
        p_print_file_url: path,
        p_print_file_name: file.name,
        p_laundry_items: [] as any,
        p_service_type: "",
        p_pickup_window: {} as any,
        p_delivery_window: {} as any,
        p_special_instructions: notes || "",
        p_customer_name: profile?.full_name ?? "Customer",
      } as any);
      if (error) throw error;
      const res = data as any;
      if (!res?.success) throw new Error(res?.error || "Order failed");

      toast.success("Order sent! Merchant will start printing.");
      await refreshWallet();
      navigate(`/orders/${res.order_id}/confirmation`, { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Could not place order");
    } finally {
      setPaying(false);
      setPin("");
      setPinOpen(false);
      setUploading(false);
    }
  };

  if (loading) return <KukaPayLoader isLoading />;
  if (!merchant) return <div className="p-6">Print shop not found.</div>;

  return (
    <div className="px-5 pt-12 pb-32 space-y-5">
      <header className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="press-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-bold leading-tight">{merchant.business_name}</h1>
          <p className="text-[12px] text-muted-foreground">Printing checkout</p>
        </div>
      </header>

      {/* File upload */}
      <Card className="rounded-2xl border-0 shadow-soft">
        <CardContent className="p-4 space-y-3">
          <Label>Document</Label>
          {file ? (
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button onClick={() => setFile(null)} className="press-scale">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full h-28 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 press-scale"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tap to upload (PDF, DOC, image)</span>
              <span className="text-[11px] text-muted-foreground">Max {MAX_FILE_MB}MB</span>
            </button>
          )}
          <input
            ref={inputRef} type="file" accept={ACCEPTED} className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
        </CardContent>
      </Card>

      {/* Specs */}
      <Card className="rounded-2xl border-0 shadow-soft">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Color</Label>
              <Select value={specs.color} onValueChange={(v) => setSpecs({ ...specs, color: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bw">Black & White</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Paper</Label>
              <Select value={specs.paper} onValueChange={(v) => setSpecs({ ...specs, paper: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="a3">A3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sides</Label>
              <Select value={specs.sides} onValueChange={(v) => setSpecs({ ...specs, sides: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single-sided</SelectItem>
                  <SelectItem value="double">Double-sided</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Binding</Label>
              <Select value={specs.binding} onValueChange={(v) => setSpecs({ ...specs, binding: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="spiral">Spiral</SelectItem>
                  <SelectItem value="hardcover">Hardcover</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pages per copy</Label>
              <Input type="number" min={1} value={specs.pages}
                onChange={(e) => setSpecs({ ...specs, pages: Math.max(1, +e.target.value || 1) })} />
            </div>
            <div>
              <Label>Copies</Label>
              <Input type="number" min={1} value={specs.copies}
                onChange={(e) => setSpecs({ ...specs, copies: Math.max(1, +e.target.value || 1) })} />
            </div>
          </div>
          <div>
            <Label>Urgency</Label>
            <RadioGroup value={specs.urgency} onValueChange={(v) => setSpecs({ ...specs, urgency: v as any })}
              className="grid grid-cols-2 gap-2 mt-2">
              <label className={`p-3 rounded-xl border ${specs.urgency==='standard'?'border-primary bg-primary/5':'border-border'}`}>
                <RadioGroupItem value="standard" className="hidden" />
                <p className="font-medium text-sm">Standard</p>
                <p className="text-[11px] text-muted-foreground">Same-day / next-day</p>
              </label>
              <label className={`p-3 rounded-xl border ${specs.urgency==='express'?'border-primary bg-primary/5':'border-border'}`}>
                <RadioGroupItem value="express" className="hidden" />
                <p className="font-medium text-sm">Express</p>
                <p className="text-[11px] text-muted-foreground">+50% rush fee</p>
              </label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Delivery */}
      <Card className="rounded-2xl border-0 shadow-soft">
        <CardContent className="p-4 space-y-3">
          <Label>Fulfillment</Label>
          <RadioGroup value={delivery} onValueChange={(v) => setDelivery(v as any)} className="grid grid-cols-2 gap-2">
            <label className={`p-3 rounded-xl border ${delivery==='pickup'?'border-primary bg-primary/5':'border-border'}`}>
              <RadioGroupItem value="pickup" className="hidden" />
              <p className="font-medium text-sm">Pickup</p>
              <p className="text-[11px] text-muted-foreground">Free</p>
            </label>
            <label className={`p-3 rounded-xl border ${delivery==='delivery'?'border-primary bg-primary/5':'border-border'}`}>
              <RadioGroupItem value="delivery" className="hidden" />
              <p className="font-medium text-sm">Delivery</p>
              <p className="text-[11px] text-muted-foreground">+₦{(pricing.delivery_fee ?? merchant?.delivery_fee ?? 300).toLocaleString()}</p>
            </label>
          </RadioGroup>
          {delivery === "delivery" && (
            <Input placeholder="Hostel / room / building" value={address} onChange={(e) => setAddress(e.target.value)} />
          )}
          <Textarea placeholder="Special instructions (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="rounded-2xl border-0 shadow-soft bg-primary/5">
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span>Printing</span><span>₦{subtotal.toLocaleString()}</span></div>
          {deliveryFee > 0 && <div className="flex justify-between"><span>Delivery</span><span>₦{deliveryFee.toLocaleString()}</span></div>}
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
              ₦{total.toLocaleString()} will be held in escrow until your order is delivered.
            </p>
            <PasscodePad value={pin} onChange={setPin} length={4} onComplete={submitOrder} loading={paying} />
            <Button onClick={() => submitOrder()} disabled={pin.length !== 4 || paying} className="w-full h-12 rounded-2xl">
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm payment"}
            </Button>
            {uploading && <p className="text-center text-xs text-muted-foreground">Uploading document…</p>}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PrintingCheckoutPage;
