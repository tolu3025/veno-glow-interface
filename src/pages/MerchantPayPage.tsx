import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Store, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { friendlyInvoke } from "@/lib/friendlyInvoke";

const MerchantPayPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wallet, refreshWallet } = useAuth();
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [pinDialog, setPinDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (id) loadMerchant();
  }, [id]);

  const loadMerchant = async () => {
    try {
      const data = await friendlyInvoke<{ merchant: any }>("manage-merchant", {
        body: { action: "get_merchant", merchant_id: id },
      }, "Couldn't load merchant.");
      setMerchant(data.merchant);
    } catch (e: any) {
      toast.error(e.message);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (pin.length < 4) { toast.error("Enter your 4-digit PIN"); return; }
    setPaying(true);
    try {
      const data = await friendlyInvoke<any>("manage-merchant", {
        body: { action: "pay", merchant_id: id, amount: Number(amount), pin },
      }, "Payment failed. Please try again.");
      setPinDialog(false);
      setPin("");
      setResult(data);
      setSuccess(true);
      await refreshWallet();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="px-5 pt-10 pb-4 space-y-5">
        <div className="flex flex-col items-center text-center space-y-4 py-10">
          <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center animate-in zoom-in duration-500">
            <CheckCircle className="h-10 w-10 text-accent" />
          </div>
          <h2 className="text-xl font-bold">Payment Successful!</h2>
          <p className="font-mono-num text-3xl font-bold">₦{Number(amount).toLocaleString("en-NG")}</p>
          <p className="text-sm text-muted-foreground">Paid to {merchant?.business_name}</p>
          {result?.reference && (
            <p className="text-[10px] text-muted-foreground font-mono-num">Ref: {result.reference}</p>
          )}
          <Button onClick={() => navigate("/")} className="mt-4">Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-4 space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <Card className="bg-primary text-primary-foreground overflow-hidden relative">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{merchant?.business_name}</h2>
              {merchant?.description && <p className="text-sm opacity-80">{merchant.description}</p>}
            </div>
          </div>
        </CardContent>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/20" />
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>Amount to Pay</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold">₦</span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0.00"
                className="pl-8 text-2xl font-mono-num font-bold h-14"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
            <p className="text-xs text-muted-foreground">Balance: ₦{(wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
          </div>

          {Number(amount) > (wallet?.balance ?? 0) && Number(amount) > 0 && (
            <div className="flex items-center gap-1.5 text-destructive text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Insufficient balance</span>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!amount || Number(amount) <= 0 || Number(amount) > (wallet?.balance ?? 0)}
            onClick={() => setPinDialog(true)}
          >
            Pay ₦{Number(amount || 0).toLocaleString("en-NG")}
          </Button>
        </CardContent>
      </Card>

      {/* PIN Dialog */}
      <Dialog open={pinDialog} onOpenChange={setPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Paying</p>
              <p className="font-mono-num text-xl font-bold">₦{Number(amount).toLocaleString("en-NG")}</p>
              <p className="text-sm text-muted-foreground">to {merchant?.business_name}</p>
            </div>
            <div className="space-y-2">
              <Label>Transaction PIN</Label>
              <Input type="password" inputMode="numeric" maxLength={6} placeholder="Enter PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPinDialog(false); setPin(""); }}>Cancel</Button>
            <Button onClick={handlePay} disabled={paying || pin.length < 4}>
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchantPayPage;
