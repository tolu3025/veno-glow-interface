import {
  ArrowLeft, Loader2, CheckCircle, Wallet, Users, Calendar, User, Copy, Building2, Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface CollectionInfo {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  amount_per_person: number | null;
  total_collected: number;
  participant_count: number;
  status: string;
  deadline: string | null;
  require_matric: boolean | null;
  virtual_account_number: string | null;
  virtual_bank_name: string | null;
  virtual_account_name: string | null;
  organizer_name: string | null;
}

export const displayAccountName = (name: string | null | undefined, title: string) =>
  name && /^kukapay/i.test(name.trim()) ? name : `Kukapay/${title}`;

const PayCollectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, wallet, refreshWallet } = useAuth();

  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"info" | "success" | "awaiting" | "guest_receipt">("info");
  const [payerName, setPayerName] = useState("");
  const [payerMatric, setPayerMatric] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchCollection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Poll for the bank transfer to be matched once the guest says they've paid
  useEffect(() => {
    if (step !== "awaiting" || !claimId) return;
    let stop = false;
    const check = async () => {
      const { data } = await (supabase.rpc as any)("get_collection_claim_status", { p_claim_id: claimId });
      const row = Array.isArray(data) ? data[0] : null;
      if (!stop && row && row.status === "confirmed") {
        setConfirmedAt(row.confirmed_at || new Date().toISOString());
        if (row.payer_matric_number) setPayerMatric(row.payer_matric_number);
        setStep("guest_receipt");
      }
    };
    check();
    const t = setInterval(check, 5000);
    return () => { stop = true; clearInterval(t); };
  }, [step, claimId]);

  const shareGuestReceipt = () => {
    const text = `KukaPay Collection Receipt\n\nCollection: ${collection?.title}\nPaid by: ${payerName}${payerMatric ? ` (${payerMatric})` : ""}\nAmount: ₦${Number(amount).toLocaleString()}\nRef: ${claimId}\nDate: ${confirmedAt ? format(new Date(confirmedAt), "MMM d, yyyy · h:mm a") : ""}\nStatus: Confirmed`;
    if (navigator.share) navigator.share({ title: "Payment Receipt", text }).catch(() => {});
    else { navigator.clipboard.writeText(text); toast.success("Receipt copied"); }
  };

  // Pre-fill the transfer details for signed-in users
  useEffect(() => {
    if (!profile) return;
    setPayerName((prev) => prev || profile.full_name || "");
    setPayerMatric((prev) => prev || profile.matric_number || "");
  }, [profile]);

  const fetchCollection = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_public_collection", {
      p_collection_id: id!,
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) {
      setCollection(null);
      setLoading(false);
      return;
    }
    setCollection(row as unknown as CollectionInfo);
    if (row.amount_per_person) setAmount(String(row.amount_per_person));
    setLoading(false);
  };

  const saveTransferDetails = async () => {
    const num = Number(amount);
    if (!payerName.trim() || payerName.trim().length < 2) {
      toast.error("Enter your full name");
      return;
    }
    if (collection?.require_matric && !payerMatric.trim()) {
      toast.error("Enter your matric number");
      return;
    }
    if (!num || num <= 0) {
      toast.error("Enter the amount you'll transfer");
      return;
    }
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc("claim_collection_payment", {
        p_collection_id: collection!.id,
        p_amount: num,
        p_payer_name: payerName.trim(),
        p_payer_matric: payerMatric.trim() || undefined,
        p_payer_phone: (profile as any)?.phone_number || undefined,
      });
      if (error) throw error;
      setClaimId(data as unknown as string);
      setClaimed(true);
      toast.success("Saved — now make the transfer");
    } catch {
      toast.error("We couldn't save your details. Please try again.");
    } finally {
      setClaiming(false);
    }
  };


  const payWithWallet = async () => {
    if (!user || !profile) return;
    const num = Number(amount);
    if (!num || num <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setPaying(true);
    try {
      await friendlyInvoke<any>("manage-collection", {
        body: {
          action: "pay_wallet",
          collection_id: collection!.id,
          amount: num,
          payer_name: profile.full_name,
          payer_matric: profile.matric_number,
        },
      }, "Payment failed. Please try again.");
      await refreshWallet();
      setStep("success");
      toast.success("Payment successful!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPaying(false);
    }
  };

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="px-5 pt-10 text-center space-y-4">
        <h1 className="text-lg font-bold">Collection Not Found</h1>
        <p className="text-sm text-muted-foreground">This collection may have been removed or doesn't exist.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  if (collection.status !== "active") {
    return (
      <div className="px-5 pt-10 text-center space-y-4">
        <h1 className="text-lg font-bold">Collection Closed</h1>
        <p className="text-sm text-muted-foreground">This collection is no longer accepting payments.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const progressPct = Math.min(100, (collection.total_collected / collection.target_amount) * 100);
  const accountName = displayAccountName(collection.virtual_account_name, collection.title);

  return (
    <div className="px-5 pt-10 pb-8 space-y-5 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold truncate">{collection.title}</h1>
      </div>

      {step === "info" && (
        <>
          <Card>
            <CardContent className="p-5 space-y-4">
              {collection.description && (
                <p className="text-sm text-muted-foreground">{collection.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Organizer:</span>
                  <span className="font-medium">{collection.organizer_name || "—"}</span>
                </div>
                {collection.amount_per_person && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold font-mono-num">₦{collection.amount_per_person.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Participants:</span>
                  <span className="font-medium">{collection.participant_count}</span>
                </div>
                {collection.deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Deadline:</span>
                    <span className="font-medium">{format(new Date(collection.deadline), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>

              <Progress value={progressPct} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₦{collection.total_collected.toLocaleString()} raised</span>
                <span>₦{collection.target_amount.toLocaleString()} goal</span>
              </div>
            </CardContent>
          </Card>

          {/* ── STEP 1 (guests): collect payer details before showing account ── */}
          {collection.virtual_account_number && !claimed && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    You don't need a Kukapay account. Fill in your details below and
                    confirm — we'll then show you the account to transfer to.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Your full name</Label>
                  <Input
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="e.g. Adams Owoade"
                  />
                </div>
                {collection.require_matric && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Your matric number</Label>
                    <Input
                      value={payerMatric}
                      onChange={(e) => setPayerMatric(e.target.value)}
                      placeholder="e.g. 2024/58702"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount you will transfer (₦)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="font-mono"
                  />
                </div>
                <Button className="w-full" onClick={saveTransferDetails} disabled={claiming}>
                  {claiming && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Confirm details
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── STEP 2: BANK TRANSFER DETAILS ── */}
          {collection.virtual_account_number && claimed && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Transfer the amount from any bank app to the account below — it is
                    credited to this collection automatically.
                  </p>
                </div>


                <div className="rounded-xl bg-background p-3 space-y-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Account number</p>
                  <p className="font-mono text-xl font-bold">{collection.virtual_account_number}</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {collection.virtual_bank_name || "Flutterwave MFB"}
                  </p>
                  <p className="text-sm text-muted-foreground">{accountName}</p>
                </div>

                {/* Most banks never forward the remark, so we matched the payer's
                    details to the incoming transfer beforehand. */}
                <div className="rounded-xl bg-background p-3 space-y-1">
                    <p className="text-xs font-semibold text-accent flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Details saved
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Now transfer exactly{" "}
                      <span className="font-bold text-foreground">
                        ₦{Number(amount).toLocaleString()}
                      </span>{" "}
                      to the account above. Your payment will appear on the list as{" "}
                      <span className="font-medium text-foreground">{payerName}</span>
                      {payerMatric ? ` (${payerMatric})` : ""}.
                    </p>
                    <button
                      type="button"
                      onClick={() => setClaimed(false)}
                      className="text-xs text-primary underline"
                    >
                      Edit my details
                    </button>
                </div>


                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => copy(collection.virtual_account_number!, "Account number")}
                >
                  <Copy className="h-4 w-4" /> Copy Account Number
                </Button>
                {claimId && (
                  <Button className="w-full" onClick={() => setStep("awaiting")}>
                    I've made the transfer
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── PAY WITH KUKAPAY WALLET ── */}
          {user ? (
            <>
              {!collection.amount_per_person && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <Label>Amount (₦)</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="font-mono text-lg"
                    />
                  </CardContent>
                </Card>
              )}

              <div className="text-xs text-muted-foreground text-right">
                Wallet Balance: ₦{(wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </div>

              <Button onClick={payWithWallet} disabled={paying} className="w-full gap-2" size="lg">
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Pay With Kukapay Wallet
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground">
                Already have a Kukapay account? Log in to pay from your wallet.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/login?redirect=/pay/${collection.id}`)}
              >
                Log in to Kukapay
              </Button>
            </div>
          )}
        </>
      )}

      {step === "awaiting" && (
        <div className="flex flex-col items-center text-center space-y-5 pt-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Confirming your transfer…</h2>
            <p className="text-sm text-muted-foreground">
              We're waiting for your ₦{Number(amount).toLocaleString()} transfer to arrive. This usually takes under a minute — keep this page open.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setStep("info")}>
            Back to transfer details
          </Button>
        </div>
      )}

      {step === "guest_receipt" && (
        <div className="flex flex-col items-center text-center space-y-5 pt-6">
          <div className="h-20 w-20 rounded-full bg-accent/15 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-accent" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Payment Received!</h2>
            <p className="text-3xl font-mono font-bold text-primary">
              ₦{Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground">to "{collection.title}"</p>
          </div>
          <Card className="w-full text-left">
            <CardContent className="p-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Paid by</span><span className="font-semibold">{payerName}</span></div>
              {payerMatric && <div className="flex justify-between"><span className="text-muted-foreground">Matric no.</span><span>{payerMatric}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Organizer</span><span>{collection.organizer_name || "—"}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs truncate">{claimId?.slice(0, 18)}</span></div>
              {confirmedAt && <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-xs">{format(new Date(confirmedAt), "MMM d, yyyy · h:mm a")}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-accent font-semibold text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Confirmed</span></div>
            </CardContent>
          </Card>
          <Button variant="outline" className="w-full" onClick={shareGuestReceipt}>Share / Save Receipt</Button>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center text-center space-y-5 pt-8">
          <div className="h-20 w-20 rounded-full bg-accent/15 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-accent" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Payment Successful!</h2>
            <p className="text-2xl font-mono font-bold">
              ₦{Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground">Your contribution to "{collection.title}" has been recorded.</p>
          </div>
          <Button onClick={() => navigate("/")} className="w-full">
            Done
          </Button>
        </div>
      )}
    </div>
  );
};

export default PayCollectionPage;
