import {
  ArrowLeft, CheckCircle, Delete, Loader2, Zap, Wifi, Smartphone,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import TransactionFeedback from "@/components/dashboard/TransactionFeedback";
import { PasscodePad } from "@/components/shared/PasscodePad";

import mtnLogo from "@/assets/networks/mtn.png";
import gloLogo from "@/assets/networks/glo.png";
import airtelLogo from "@/assets/networks/airtel.png";
import nineMobileLogo from "@/assets/networks/9mobile.png";

const NETWORKS = [
  { id: "mtn", name: "MTN", logo: mtnLogo },
  { id: "glo", name: "Glo", logo: gloLogo },
  { id: "airtel", name: "Airtel", logo: airtelLogo },
  { id: "9mobile", name: "9mobile", logo: nineMobileLogo },
];

const AIRTIME_AMOUNTS = [50, 100, 200, 500, 1000, 2000, 5000];

// NCC prefix → network id
const NETWORK_PREFIXES: Record<string, string> = {
  "0703": "mtn", "0704": "mtn", "0706": "mtn", "0707": "mtn",
  "0803": "mtn", "0806": "mtn", "0810": "mtn", "0813": "mtn",
  "0814": "mtn", "0816": "mtn", "0903": "mtn", "0906": "mtn",
  "0913": "mtn", "0916": "mtn",
  "0701": "airtel", "0708": "airtel", "0802": "airtel", "0808": "airtel",
  "0812": "airtel", "0901": "airtel", "0902": "airtel", "0904": "airtel",
  "0907": "airtel", "0912": "airtel",
  "0705": "glo", "0805": "glo", "0807": "glo", "0811": "glo",
  "0815": "glo", "0905": "glo", "0915": "glo",
  "0809": "9mobile", "0817": "9mobile", "0818": "9mobile",
  "0908": "9mobile", "0909": "9mobile",
};
const detectNetwork = (phone: string): string | null =>
  phone.length >= 4 ? NETWORK_PREFIXES[phone.slice(0, 4)] ?? null : null;

type Mode = "airtime" | "data";
type Step = "select" | "confirm" | "pin" | "success";

interface DataPlan {
  plan_id: string;
  name: string;
  price: number;
  validity: string;
}

const AirtimePage = () => {
  const navigate = useNavigate();
  const { profile, wallet, refreshWallet } = useAuth();

  const [mode, setMode] = useState<Mode>("airtime");
  const [step, setStep] = useState<Step>("select");
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [cashback, setCashback] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");
  const [showFeedback, setShowFeedback] = useState(true);
  const [txId, setTxId] = useState("");

  // Data-specific state
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [planId, setPlanId] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);

  const selectedNetwork = NETWORKS.find(n => n.id === network);
  const selectedPlan = dataPlans.find(p => p.plan_id === planId);
  const finalAmount = mode === "airtime"
    ? Number(amount) || Number(customAmount)
    : selectedPlan?.price ?? 0;

  // Reset selections when switching mode
  useEffect(() => {
    setAmount(""); setCustomAmount(""); setPlanId("");
  }, [mode]);

  // Auto-detect network from phone prefix
  const detected = detectNetwork(phone);
  useEffect(() => {
    if (detected && detected !== network) setNetwork(detected);
  }, [detected]);
  const networkMismatch = !!(detected && network && detected !== network);

  // Fetch data plans when switching to data mode + network changes
  useEffect(() => {
    if (mode !== "data" || !network) return;
    setPlansLoading(true);
    setPlanId("");
    (async () => {
      try {
        const data = await friendlyInvoke<{ plans?: DataPlan[] }>(
          "get-clubkonnect-data-plans",
          { body: { network } },
          "Failed to load data plans"
        );
        setDataPlans(data.plans ?? []);
      } catch (e: any) {
        toast.error(e.message);
        setDataPlans([]);
      } finally {
        setPlansLoading(false);
      }
    })();
  }, [mode, network]);

  const handleContinue = () => {
    if (!network) { toast.error("Select a network"); return; }
    if (!phone || phone.length < 10) { toast.error("Enter a valid phone number"); return; }
    if (networkMismatch) {
      toast.error(`Phone number belongs to ${NETWORKS.find(n => n.id === detected)?.name}. Switch network or fix the number.`);
      return;
    }
    if (mode === "airtime") {
      if (finalAmount < 50) { toast.error("Minimum airtime is ₦50"); return; }
    } else {
      if (!planId) { toast.error("Select a data plan"); return; }
    }
    if (finalAmount > (wallet?.balance ?? 0)) { toast.error("Insufficient balance"); return; }
    if (!profile?.has_transaction_pin) { toast.error("Set a transaction PIN first in Send Money"); return; }
    setStep("confirm");
  };

  const handleSubmit = async (entered?: string) => {
    const usePin = entered ?? pin;
    if (usePin.length !== 4) return;
    setLoading(true);

    const fnName = mode === "airtime" ? "purchase-utility" : "purchase-clubkonnect-data";
    const body = mode === "airtime"
      ? { type: "airtime", network, phone, amount: finalAmount, pin: usePin }
      : { network, phone, plan_id: planId, pin: usePin };

    try {
      const data = await friendlyInvoke<{ reference: string; transaction_id?: string; cashback?: number }>(
        fnName, { body }, "Purchase failed. Please try again."
      );
      setReference(data.reference);
      setTxId(data.transaction_id || "");
      setCashback(Number(data.cashback) || 0);
      setShowFeedback(true);
      await refreshWallet();
      setStep("success");
      toast.success(mode === "airtime" ? "Airtime purchase successful!" : "Data bundle delivered!");
    } catch (e: any) {
      toast.error(e.message);
      if (/incorrect pin/i.test(e.message)) {
        setPin("");
        setPinError(true);
        setTimeout(() => setPinError(false), 600);
      }
    } finally {
      setLoading(false);
    }
  };

  const PinPad = () => (
    <div className="flex flex-col items-center space-y-4">
      <PasscodePad
        value={pin}
        onChange={setPin}
        onComplete={handleSubmit}
        title="Enter Transaction PIN"
        subtitle={`Authorize ₦${finalAmount.toLocaleString()} purchase`}
        loading={loading}
        error={pinError}
      />
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Processing…
        </div>
      )}
    </div>
  );

  return (
    <div className="px-5 pt-10 pb-24 space-y-5 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === "select") navigate(-1);
            else if (step === "confirm") setStep("select");
            else if (step === "pin") setStep("confirm");
            else navigate("/");
          }}
          className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold">
          {step === "success" ? "Purchase Complete" : "Buy Airtime & Data"}
        </h1>
      </div>

      {step === "select" && (
        <div className="space-y-5">
          {/* Mode tabs */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="w-full">
              <TabsTrigger value="airtime" className="flex-1 gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> Airtime
              </TabsTrigger>
              <TabsTrigger value="data" className="flex-1 gap-1.5">
                <Wifi className="h-3.5 w-3.5" /> Data
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-accent/10">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent">Zero fees, instant delivery</span>
          </div>

          {/* Network */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Network</label>
            <div className="grid grid-cols-4 gap-2">
              {NETWORKS.map(n => (
                <button
                  key={n.id}
                  onClick={() => setNetwork(n.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${
                    network === n.id ? "bg-primary/10 ring-2 ring-primary" : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <img src={n.logo} alt={n.name} className="h-8 w-8 rounded-full object-contain" />
                  <span className="text-[11px] font-medium">{n.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              maxLength={11}
            />
            {detected && !networkMismatch && (
              <p className="text-[11px] text-muted-foreground">
                Detected: <span className="font-semibold text-foreground">{NETWORKS.find(n => n.id === detected)?.name}</span>
              </p>
            )}
            {networkMismatch && (
              <p className="text-[11px] text-destructive">
                This number is {NETWORKS.find(n => n.id === detected)?.name}, but {selectedNetwork?.name} is selected.
              </p>
            )}
          </div>

          {/* Airtime amount or Data plan */}
          {mode === "airtime" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="grid grid-cols-4 gap-2">
                {AIRTIME_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => { setAmount(String(a)); setCustomAmount(""); }}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                      amount === String(a) ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    ₦{a.toLocaleString()}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Or enter custom amount"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setAmount(""); }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Plan</label>
              {!network ? (
                <p className="text-xs text-muted-foreground py-3">Select a network to see plans</p>
              ) : plansLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading plans...
                </div>
              ) : dataPlans.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3">No data plans available right now.</p>
              ) : (
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataPlans.map(p => (
                      <SelectItem key={p.plan_id} value={p.plan_id}>
                        {p.name} — ₦{p.price.toLocaleString()} ({p.validity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-right">
            Balance: ₦{(wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </p>

          <Button onClick={handleContinue} className="w-full" size="lg">
            Continue
          </Button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-5">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold text-center">Confirm Purchase</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-semibold">{mode === "airtime" ? "Airtime" : "Data Bundle"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-semibold">{selectedNetwork?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-mono">{phone}</span>
                </div>
                {mode === "data" && selectedPlan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-semibold text-right text-xs max-w-[60%]">{selectedPlan.name} ({selectedPlan.validity})</span>
                  </div>
                )}
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono font-bold text-lg">₦{finalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="text-accent font-semibold">₦0.00 (Free)</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Button onClick={() => { setPin(""); setStep("pin"); }} className="w-full" size="lg">
            Confirm & Enter PIN
          </Button>
        </div>
      )}

      {step === "pin" && <PinPad />}

      {step === "success" && (
        <div className="flex flex-col items-center text-center space-y-5 pt-8">
          <div className="h-20 w-20 rounded-full bg-accent/15 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-accent" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Purchase Successful!</h2>
            <p className="text-sm text-muted-foreground">
              {mode === "airtime" ? "Airtime" : "Data bundle"} sent to {phone}
            </p>
          </div>
          <Card className="w-full">
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">{reference?.slice(0, 20)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-mono font-bold">₦{finalAmount.toLocaleString()}</span>
              </div>
              {cashback > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cashback earned</span>
                  <span className="font-mono font-bold text-accent">+₦{cashback.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Balance</span>
                <span className="font-mono font-bold">₦{(wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          {showFeedback && (
            <Card className="w-full">
              <CardContent className="p-4">
                <TransactionFeedback
                  transactionId={txId || reference}
                  onSubmitted={() => setShowFeedback(false)}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>Home</Button>
            <Button className="flex-1" onClick={() => { setStep("select"); setPin(""); setPhone(""); setAmount(""); setPlanId(""); setShowFeedback(true); }}>
              Buy Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirtimePage;
