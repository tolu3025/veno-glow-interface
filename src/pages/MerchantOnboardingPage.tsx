import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, Building2, QrCode, CheckCircle, Loader2, Info, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";

const categories = [
  "Food & Drinks", "Printing & Stationery", "Fashion & Accessories",
  "Laundry", "Barbing & Beauty", "Electronics & Repairs",
  "Health & Pharmacy", "Transport", "Other",
];

const steps = ["Business Details", "Settlement Account", "Review & Submit"];

const MerchantOnboardingPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { requestLocation, loading: locLoading } = useGeolocation();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({
    business_name: "",
    description: "",
    category: "",
    settlement_account_number: "",
    settlement_bank_name: "",
    settlement_account_name: "",
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const captureLocation = async () => {
    const c = await requestLocation();
    if (c) {
      setCoords(c);
      toast.success("Pickup location saved!");
    } else {
      toast.error("Could not get your location. Please allow access and retry.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await friendlyInvoke("manage-merchant", {
        body: {
          action: "register",
          ...form,
          latitude: coords?.lat,
          longitude: coords?.lng,
        },
      }, "Registration failed");
      toast.success("Merchant application submitted! Awaiting admin approval.");
      navigate("/merchants/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if ((profile?.kyc_level ?? 0) < 3) {
    return (
      <div className="px-5 pt-10 pb-4 space-y-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 text-center space-y-3">
            <Store className="h-10 w-10 mx-auto text-destructive" />
            <h2 className="font-bold">KYC Level 3 Required</h2>
            <p className="text-sm text-muted-foreground">Complete address verification to register as a merchant.</p>
            <Button onClick={() => navigate("/kyc")} className="gap-2">
              Complete KYC
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-4 space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-xl font-bold">Become a Merchant</h1>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          {steps.map((s, i) => (
            <span key={s} className={i <= step ? "text-primary font-medium" : ""}>{s}</span>
          ))}
        </div>
        <Progress value={((step + 1) / steps.length) * 100} className="h-1.5" />
      </div>

      {/* Step 0: Business Details */}
      {step === 0 && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input placeholder="e.g. Amala Junction" value={form.business_name} onChange={e => update("business_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => update("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c.toLowerCase().replace(/ & /g, "_")}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea placeholder="What does your business do?" value={form.description} onChange={e => update("description", e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Pickup Location</Label>
              <p className="text-[11px] text-muted-foreground">
                Share your store's location so runners know where to pick up orders. Customers will see this as the pickup pin on the delivery map.
              </p>
              <Button
                type="button"
                variant={coords ? "outline" : "secondary"}
                className="w-full gap-2"
                onClick={captureLocation}
                disabled={locLoading}
              >
                {locLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {coords ? "Location saved ✓ — tap to update" : "Share store location"}
              </Button>
              {coords && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              )}
            </div>
            <Button className="w-full" disabled={!form.business_name || !form.category} onClick={() => setStep(1)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Settlement Account */}
      {step === 1 && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">For withdrawing your earnings to a bank account. You can add this later.</p>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input placeholder="0123456789" inputMode="numeric" maxLength={10} value={form.settlement_account_number} onChange={e => update("settlement_account_number", e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input placeholder="e.g. GTBank" value={form.settlement_bank_name} onChange={e => update("settlement_bank_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input placeholder="Account holder name" value={form.settlement_account_name} onChange={e => update("settlement_account_name", e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(2)}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Review Your Application</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Business</span><span className="font-medium">{form.business_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium capitalize">{form.category.replace(/_/g, " ")}</span></div>
                {form.settlement_bank_name && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-medium">{form.settlement_bank_name}</span></div>
                )}
                {form.settlement_account_number && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-mono-num font-medium">{form.settlement_account_number}</span></div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Commission Info */}
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <Info className="h-4 w-4 text-accent" />
                <h4 className="text-sm font-semibold text-accent">Commission Structure</h4>
              </div>
              <p className="text-xs text-muted-foreground">Kuka Pay charges a <span className="font-bold text-foreground">1.5%</span> commission on each payment you receive. This covers payment processing, fraud protection, and platform maintenance.</p>
              <div className="bg-background rounded-lg p-3 space-y-1 text-xs">
                <div className="flex justify-between"><span>Customer pays</span><span className="font-mono-num font-bold">₦1,000</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Commission (1.5%)</span><span className="font-mono-num">-₦15</span></div>
                <div className="border-t pt-1 flex justify-between font-medium"><span>You receive</span><span className="font-mono-num text-accent font-bold">₦985</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Submit Application
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantOnboardingPage;
