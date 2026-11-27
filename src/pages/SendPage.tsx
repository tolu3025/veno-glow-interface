import {
  ArrowLeft, Search, Send, User, CheckCircle, Loader2, AlertCircle, Delete,
  Star, Plus, Pencil, Trash2, Share2, Clock, Copy, BookUser, X,
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";
import { PasscodePad } from "@/components/shared/PasscodePad";

type Step = "search" | "amount" | "confirm" | "pin" | "set_pin" | "success";

interface Recipient {
  id: string;
  full_name: string;
  matric_number: string;
  university: string;
}

interface Beneficiary {
  id: string;
  user_id: string;
  nickname: string | null;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_favorite: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const DAILY_LIMIT = 100_000;

const SendPage = () => {
  const navigate = useNavigate();
  const { user, profile, wallet, refreshWallet } = useAuth();

  const [tab, setTab] = useState("send");
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [searching, setSearching] = useState(false);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinStep, setPinStep] = useState<"create" | "confirm">("create");
  const [loading, setLoading] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [transferRef, setTransferRef] = useState("");
  const [transferTime, setTransferTime] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Beneficiaries state
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingBenefs, setLoadingBenefs] = useState(true);
  const [addBenefDialog, setAddBenefDialog] = useState(false);
  const [editBenef, setEditBenef] = useState<Beneficiary | null>(null);
  const [benefForm, setBenefForm] = useState({ nickname: "", bank_name: "", bank_code: "", account_number: "", account_name: "" });

  // Transfer history state
  const [transfers, setTransfers] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");

  useEffect(() => {
    if (user) {
      loadBeneficiaries();
      loadTransferHistory();
    }
  }, [user]);

  const loadBeneficiaries = async () => {
    setLoadingBenefs(true);
    const { data } = await supabase
      .from("saved_beneficiaries")
      .select("*")
      .eq("user_id", user!.id)
      .order("is_favorite", { ascending: false })
      .order("updated_at", { ascending: false });
    setBeneficiaries((data as Beneficiary[]) || []);
    setLoadingBenefs(false);
  };

  const loadTransferHistory = async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user!.id)
      .eq("type", "p2p_transfer")
      .order("created_at", { ascending: false })
      .limit(100);
    setTransfers((data as Transaction[]) || []);
    setLoadingHistory(false);
  };

  const saveBeneficiary = async () => {
    if (!benefForm.account_name || !benefForm.account_number || !benefForm.bank_name) {
      toast.error("Fill all required fields");
      return;
    }
    if (benefForm.account_number.length !== 10) {
      toast.error("Account number must be 10 digits");
      return;
    }

    if (editBenef) {
      await supabase
        .from("saved_beneficiaries")
        .update({ nickname: benefForm.nickname || null, bank_name: benefForm.bank_name, account_name: benefForm.account_name, updated_at: new Date().toISOString() })
        .eq("id", editBenef.id);
      toast.success("Beneficiary updated");
    } else {
      const { error } = await supabase
        .from("saved_beneficiaries")
        .insert({
          user_id: user!.id,
          nickname: benefForm.nickname || null,
          bank_name: benefForm.bank_name,
          bank_code: benefForm.bank_code || "000",
          account_number: benefForm.account_number,
          account_name: benefForm.account_name,
        });
      if (error?.code === "23505") {
        toast.error("This beneficiary already exists");
        return;
      }
      if (error) { toast.error("Failed to save"); return; }
      toast.success("Beneficiary saved");
    }
    setAddBenefDialog(false);
    setEditBenef(null);
    setBenefForm({ nickname: "", bank_name: "", bank_code: "", account_number: "", account_name: "" });
    loadBeneficiaries();
  };

  const deleteBeneficiary = async (id: string) => {
    if (!confirm("Delete this beneficiary?")) return;
    await supabase.from("saved_beneficiaries").delete().eq("id", id);
    toast.success("Deleted");
    loadBeneficiaries();
  };

  const toggleFavorite = async (b: Beneficiary) => {
    await supabase.from("saved_beneficiaries").update({ is_favorite: !b.is_favorite }).eq("id", b.id);
    loadBeneficiaries();
  };

  const searchRecipients = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await friendlyInvoke<{ results?: Recipient[] }>("p2p-transfer", {
          body: { action: "search", query: query.trim() },
        }, "Search failed");
        if (data?.results) setSearchResults(data.results);
      } catch {
        // Silent — empty results OK
      }
      setSearching(false);
    }, 400);
  }, []);

  const selectRecipient = (r: Recipient) => {
    setRecipient(r);
    if (!profile?.has_transaction_pin) setStep("set_pin");
    else setStep("amount");
  };

  const handleSetPin = async (entered?: string) => {
    if (pinStep === "create") {
      const created = entered ?? newPin;
      if (created.length !== 4) return;
      setNewPin(created);
      setPinStep("confirm");
      setConfirmPin("");
      return;
    }
    const confirmValue = entered ?? confirmPin;
    if (confirmValue !== newPin) {
      toast.error("PINs don't match. Try again.");
      setPinStep("create"); setNewPin(""); setConfirmPin("");
      return;
    }
    setLoading(true);
    try {
      await friendlyInvoke("p2p-transfer", {
        body: { action: "set_pin", pin: newPin },
      }, "Failed to set PIN");
      toast.success("Transaction PIN set!");
      setStep("amount");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const proceedToConfirm = () => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) { toast.error("Enter a valid amount"); return; }
    if (num > (wallet?.balance ?? 0)) { toast.error("Insufficient balance"); return; }
    if (num > DAILY_LIMIT) { toast.error(`Daily limit is ₦${DAILY_LIMIT.toLocaleString()}`); return; }
    setStep("confirm");
  };

  const proceedToPin = () => { setPin(""); setStep("pin"); };

  const executeTransfer = async (entered?: string) => {
    const usePin = entered ?? pin;
    if (usePin.length !== 4) return;
    setLoading(true);
    try {
      const data = await friendlyInvoke<{ reference: string }>("p2p-transfer", {
        body: { action: "transfer", recipient_id: recipient!.id, amount: Number(amount), pin: usePin, note: note || undefined },
      }, "Transfer failed. Please try again.");
      setTransferRef(data.reference);
      setTransferTime(new Date());
      await refreshWallet();
      loadTransferHistory();
      navigate("/transfer/success", {
        replace: true,
        state: {
          amount: Number(amount),
          recipientName: recipient!.full_name,
          recipientUniversity: recipient!.university,
          reference: data.reference,
          note: note || undefined,
          time: new Date().toISOString(),
        },
      });
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

  const shareReceipt = () => {
    const text = `Kuka Pay Transfer Receipt\n\nAmount: ₦${Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}\nTo: ${recipient!.full_name}\nRef: ${transferRef}\nDate: ${transferTime ? format(transferTime, "MMM d, yyyy · h:mm a") : ""}\nFee: ₦0.00\nStatus: Completed`;
    if (navigator.share) {
      navigator.share({ title: "Transfer Receipt", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Receipt copied to clipboard");
    }
  };

  const copyRef = () => {
    navigator.clipboard.writeText(transferRef);
    toast.success("Reference copied");
  };

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const filteredHistory = transfers.filter((tx) => {
    if (historyFilter === "sent" && tx.metadata?.direction !== "debit") return false;
    if (historyFilter === "received" && tx.metadata?.direction !== "credit") return false;
    if (historyFilter === "pending" && tx.status !== "pending") return false;
    if (historySearch) {
      const s = historySearch.toLowerCase();
      const ref = tx.reference?.toLowerCase() || "";
      const note = (tx.metadata?.note || "").toLowerCase();
      if (!ref.includes(s) && !note.includes(s)) return false;
    }
    return true;
  });

  // PinPad now provided by shared PasscodePad (auto-confirms on completion).

  // When in send flow, show the flow steps
  if (tab === "send" && step !== "search") {
    return (
      <div className="px-5 pt-10 pb-8 space-y-5 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => {
            if (step === "amount") setStep("search");
            else if (step === "confirm") setStep("amount");
            else if (step === "pin") setStep("confirm");
            else if (step === "set_pin") setStep("search");
            else if (step === "success") { setStep("search"); setTab("send"); }
          }} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold">{step === "success" ? "Transfer Complete" : "Send Money"}</h1>
        </div>

        {/* SET PIN */}
        {step === "set_pin" && (
          <div className="pt-4">
            <PasscodePad
              value={pinStep === "create" ? newPin : confirmPin}
              onChange={pinStep === "create" ? setNewPin : setConfirmPin}
              onComplete={handleSetPin}
              title={pinStep === "create" ? "Create Transaction PIN" : "Confirm PIN"}
              subtitle={pinStep === "create" ? "Set a 4-digit PIN to authorize transfers" : "Enter your PIN again to confirm"}
              loading={loading}
            />
            {loading && <div className="flex justify-center mt-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
          </div>
        )}

        {/* AMOUNT */}
        {step === "amount" && recipient && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">{initials(recipient.full_name)}</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{recipient.full_name}</p>
                <p className="text-xs text-muted-foreground">{recipient.university}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (₦)</label>
              <Input type="number" inputMode="numeric" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-2xl font-mono-num h-14 text-center" />
              <p className="text-xs text-muted-foreground text-right">Balance: ₦{(wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea placeholder="What's this for?" value={note} onChange={(e) => setNote(e.target.value)} maxLength={100} rows={2} />
            </div>
            <Button onClick={proceedToConfirm} className="w-full gap-2" size="lg">Continue <Send className="h-4 w-4" /></Button>
          </div>
        )}

        {/* CONFIRM */}
        {step === "confirm" && recipient && (
          <div className="space-y-5">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-semibold text-center">Confirm Transfer</h2>
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">{initials(recipient.full_name)}</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">To</span><span className="font-semibold">{recipient.full_name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-mono-num font-bold text-lg">₦{Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="text-accent font-semibold">₦0.00 (Free)</span></div>
                  <hr className="border-border" />
                  <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-mono-num font-bold text-lg">₦{Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span></div>
                  {note && <div className="flex justify-between"><span className="text-muted-foreground">Note</span><span className="text-right max-w-[60%] truncate">{note}</span></div>}
                </div>
              </CardContent>
            </Card>
            <Button onClick={proceedToPin} className="w-full" size="lg">Confirm & Enter PIN</Button>
          </div>
        )}

        {/* PIN */}
        {step === "pin" && (
          <div className="pt-4">
            <PasscodePad
              value={pin}
              onChange={setPin}
              onComplete={executeTransfer}
              title="Enter Transaction PIN"
              subtitle="Enter your 4-digit PIN to authorize"
              loading={loading}
              error={pinError}
            />
            {loading && <div className="flex justify-center mt-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
          </div>
        )}

        {/* SUCCESS */}
        {step === "success" && recipient && (
          <div className="flex flex-col items-center text-center space-y-5 pt-4">
            <div className="h-20 w-20 rounded-full bg-accent/15 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-accent" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">Transfer Successful!</h2>
              <p className="text-3xl font-mono-num font-bold text-primary">
                ₦{Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">sent to <span className="font-semibold text-foreground">{recipient.full_name}</span></p>
            </div>

            <Card className="w-full">
              <CardContent className="p-4 space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Reference</span>
                  <button onClick={copyRef} className="flex items-center gap-1 font-mono-num text-xs text-primary">
                    {transferRef.slice(0, 18)}… <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Recipient</span><span className="font-semibold">{recipient.full_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">University</span><span className="text-xs">{recipient.university}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="text-accent font-semibold">₦0.00</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-mono-num text-xs">{transferTime ? format(transferTime, "MMM d, yyyy · h:mm:ss a") : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing</span>
                  <span className="flex items-center gap-1 text-accent text-xs font-semibold"><CheckCircle className="h-3 w-3" /> Instant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Balance</span>
                  <span className="font-mono-num font-bold">₦{(wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 gap-1" onClick={shareReceipt}>
                <Share2 className="h-4 w-4" /> Share Receipt
              </Button>
              <Button className="flex-1" onClick={() => navigate("/")}>Done</Button>
            </div>
            <Button variant="ghost" className="text-sm text-muted-foreground" onClick={() => {
              setStep("search"); setRecipient(null); setAmount(""); setNote(""); setPin(""); setSearchQuery(""); setSearchResults([]);
            }}>Send Again</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-8 space-y-5 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Send Money</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="beneficiaries">Saved</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ── SEND TAB ── */}
        <TabsContent value="send" className="space-y-4">
          {/* Saved beneficiaries quick select */}
          {beneficiaries.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Select</p>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {beneficiaries.slice(0, 6).map((b) => (
                  <button key={b.id} className="shrink-0 flex flex-col items-center gap-1 w-16" onClick={() => {
                    // Can't directly use beneficiary for P2P — show toast
                    toast.info(`${b.nickname || b.account_name} — Use search to send to Kuka users`);
                  }}>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold font-mono-num">{initials(b.account_name)}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">{b.nickname || b.account_name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, matric no, or phone..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); searchRecipients(e.target.value); }} className="pl-10" />
          </div>

          {searching && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
            <div className="text-center py-8 text-sm text-muted-foreground">No users found matching "{searchQuery}"</div>
          )}

          <div className="space-y-2">
            {searchResults.map((r) => (
              <button key={r.id} onClick={() => selectRecipient(r)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground font-bold text-xs">{initials(r.full_name)}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{r.full_name}</p>
                  <p className="text-xs text-muted-foreground">{r.university}</p>
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* ── BENEFICIARIES TAB ── */}
        <TabsContent value="beneficiaries" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Saved Beneficiaries</p>
            <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => {
              setBenefForm({ nickname: "", bank_name: "", bank_code: "", account_number: "", account_name: "" });
              setEditBenef(null);
              setAddBenefDialog(true);
            }}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>

          {loadingBenefs ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : beneficiaries.length === 0 ? (
            <EmptyState icon={BookUser} title="No saved beneficiaries" description="Save beneficiaries for quick transfers." />
          ) : (
            <div className="space-y-2">
              {beneficiaries.map((b) => (
                <Card key={b.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold">{initials(b.account_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{b.nickname || b.account_name}</p>
                        {b.is_favorite && <Star className="h-3 w-3 text-accent fill-accent" />}
                      </div>
                      <p className="font-mono-num text-xs text-muted-foreground">{b.account_number}</p>
                      <p className="text-[10px] text-muted-foreground">{b.bank_name} · {b.account_name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleFavorite(b)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted">
                        <Star className={`h-3.5 w-3.5 ${b.is_favorite ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                      </button>
                      <button onClick={() => {
                        setEditBenef(b);
                        setBenefForm({ nickname: b.nickname || "", bank_name: b.bank_name, bank_code: b.bank_code, account_number: b.account_number, account_name: b.account_name });
                        setAddBenefDialog(true);
                      }} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => deleteBeneficiary(b.id)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── HISTORY TAB ── */}
        <TabsContent value="history" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by reference or note..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="pl-9 h-9" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[{ v: "all", l: "All" }, { v: "sent", l: "Sent" }, { v: "received", l: "Received" }, { v: "pending", l: "Pending" }].map((f) => (
              <button key={f.v} onClick={() => setHistoryFilter(f.v)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${historyFilter === f.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {f.l}
              </button>
            ))}
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filteredHistory.length === 0 ? (
            <EmptyState icon={Clock} title="No transfers found" description="Your transfer history will appear here." />
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((tx) => {
                const isCredit = tx.metadata?.direction === "credit";
                return (
                  <Card key={tx.id}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isCredit ? "bg-accent/15" : "bg-primary/10"}`}>
                            {isCredit ? <ArrowLeft className="h-4 w-4 text-accent" /> : <Send className="h-4 w-4 text-primary" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{isCredit ? "Received" : "Sent"}</p>
                            <p className="text-[10px] text-muted-foreground font-mono-num">{format(new Date(tx.created_at), "MMM d, h:mm a")}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-mono-num text-sm font-bold ${isCredit ? "text-accent" : "text-foreground"}`}>
                            {isCredit ? "+" : "-"}₦{tx.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </p>
                          <Badge variant={tx.status === "completed" ? "outline" : "secondary"} className={`text-[9px] h-4 ${tx.status === "completed" ? "text-accent border-accent/30" : ""}`}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-2">
                        <span>Fee: <span className="text-accent font-semibold">₦0.00</span></span>
                        {tx.reference && <span className="font-mono-num">{tx.reference.slice(0, 16)}…</span>}
                        {tx.metadata?.note && <span className="truncate max-w-[40%]">"{tx.metadata.note}"</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Beneficiary Dialog */}
      <Dialog open={addBenefDialog} onOpenChange={setAddBenefDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBenef ? "Edit Beneficiary" : "Add Beneficiary"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nickname (optional)</Label>
              <Input placeholder="e.g. Mom, Roommate" value={benefForm.nickname} onChange={(e) => setBenefForm({ ...benefForm, nickname: e.target.value })} maxLength={50} />
            </div>
            <div className="space-y-1.5">
              <Label>Bank Name *</Label>
              <Input placeholder="e.g. GTBank" value={benefForm.bank_name} onChange={(e) => setBenefForm({ ...benefForm, bank_name: e.target.value })} disabled={!!editBenef} />
            </div>
            <div className="space-y-1.5">
              <Label>Account Number *</Label>
              <Input placeholder="0123456789" inputMode="numeric" maxLength={10} value={benefForm.account_number}
                onChange={(e) => setBenefForm({ ...benefForm, account_number: e.target.value.replace(/\D/g, "").slice(0, 10) })} disabled={!!editBenef} />
              {benefForm.account_number.length > 0 && benefForm.account_number.length !== 10 && (
                <p className="text-xs text-destructive">Must be 10 digits</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Account Name *</Label>
              <Input placeholder="Account holder name" value={benefForm.account_name} onChange={(e) => setBenefForm({ ...benefForm, account_name: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBenefDialog(false)}>Cancel</Button>
            <Button onClick={saveBeneficiary}>{editBenef ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SendPage;
