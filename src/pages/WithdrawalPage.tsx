import {
  ArrowLeft, Building2, CheckCircle, Loader2, Clock,
  AlertTriangle, Info, Search, Share2, Copy,
  Image, FileText, Star, User, ChevronRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getKorapayBanks, resolveKorapayAccount, submitKorapayWithdrawal, checkKorapayWithdrawal } from "@/lib/korapay-payout.functions";
import { korapayReceiptStatus as receiptStatus } from "@/lib/korapay-deposit";
import { format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";
import { PasscodePad } from "@/components/shared/PasscodePad";
import { shareReceiptImage, downloadReceiptImage, downloadReceiptPdf } from "@/lib/receiptGenerator";
import { loadBanks as warmBankLogos, getBankLogoUrlSync } from "@/lib/bankLogos";

type Step = "bank" | "amount" | "confirm" | "pin" | "success";

interface BankItem {
  name: string;
  code: string;
  nip?: string | null;
  logo?: string | null;
}

interface Withdrawal {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  flutterwave_transfer_ref: string | null;
  reference: string | null;
  provider_reference: string | null;
  fee_amount: number;
  is_instant: boolean;
  created_at: string;
}

interface Beneficiary {
  id: string;
  account_name: string;
  account_number: string;
  bank_code: string;
  bank_name: string;
  is_favorite: boolean;
  nickname: string | null;
}

import { MIN_WITHDRAWAL, MAX_WITHDRAWAL } from "@/lib/constants";
import { withdrawalBreakdown, maxWithdrawableFor, MAX_WITHDRAWAL_FEE, formatNaira as fmtNaira } from "@/lib/fees";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-500/10", text: "text-yellow-600", label: "Pending" },
  processing: { bg: "bg-primary/10", text: "text-primary", label: "Processing" },
  completed: { bg: "bg-accent/10", text: "text-accent", label: "Completed" },
  refunded: { bg: "bg-destructive/10", text: "text-destructive", label: "Refunded" },
};

const WithdrawalPage = () => {
  const navigate = useNavigate();
  const { user, wallet, refreshWallet } = useAuth();
  const fetchBanks = useServerFn(getKorapayBanks);
  const enquireAccount = useServerFn(resolveKorapayAccount);
  const sendWithdrawal = useServerFn(submitKorapayWithdrawal);
  const checkWithdrawal = useServerFn(checkKorapayWithdrawal);
  const submissionKey = useRef<string | null>(null);
  const submitting = useRef(false);
  const resolveVersion = useRef(0);

  const [mainTab, setMainTab] = useState("withdraw");

  // Withdrawal form state
  const [step, setStep] = useState<Step>("bank");
  const [wdStatus, setWdStatus] = useState<string>("pending");
  const withdrawalRefForPoll = useRef<string | null>(null);
  useEffect(() => {
    const reference = withdrawalRefForPoll.current;
    if (step !== "success" || !reference) return;
    let stop = false;
    let checking = false;
    const check = async () => {
      if (checking || stop) return;
      checking = true;
      try {
        const data = await checkWithdrawal({ data: { reference } });
        if (!stop) {
          setWdStatus(data.status);
          if (!["pending", "processing"].includes(data.status)) await refreshWallet();
        }
        return data.status;
      } catch { return undefined; }
      finally { checking = false; }
    };
    check();
    const t = setInterval(async () => {
      const s = await check();
      if (s && s !== "pending" && s !== "processing") clearInterval(t);
    }, 10000);
    return () => { stop = true; clearInterval(t); };
  }, [step]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [withdrawableBalance, setWithdrawableBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [withdrawalRef, setWithdrawalRef] = useState("");
  const [submittedNet, setSubmittedNet] = useState(0);

  // Korapay bank codes are used for name enquiry and payouts.
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);

  // Beneficiaries state
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(true);

  // History state
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");

  // Bank picker overlay
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const selectedBank = banks.find((b) => b.code === bankCode) ?? banks.find((b) => b.nip === bankCode);

  useEffect(() => {
    if (user) {
      loadWithdrawalHistory();
      loadBanks();
      loadBeneficiaries();
    }
  }, [user]);

  const loadBanks = async () => {
    setLoadingBanks(true);
    warmBankLogos();
    try {
      const data = await fetchBanks();
      if (data?.banks) {
        const sorted = data.banks
          .map((b) => ({ name: b.name, code: b.code, nip: b.nipBankCode ?? null, logo: null }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setBanks(sorted);
      }
    } catch { toast.error("Couldn't load banks. Please try again."); }
    setLoadingBanks(false);
  };

  const loadBeneficiaries = async () => {
    if (!user) return;
    setLoadingBeneficiaries(true);
    const { data } = await supabase
      .from("saved_beneficiaries")
      .select("*")
      .eq("user_id", user.id)
      .order("is_favorite", { ascending: false })
      .order("account_name", { ascending: true });
    setBeneficiaries((data as Beneficiary[]) || []);
    setLoadingBeneficiaries(false);
  };

  const selectBeneficiary = (b: Beneficiary) => {
    // Older beneficiaries may hold NIP codes (e.g. Opay 100004); map them to Korapay's code.
    const match = banks.find((x) => x.code === b.bank_code) ?? banks.find((x) => x.nip === b.bank_code);
    setBankCode(match?.code ?? b.bank_code);
    setAccountNumber(b.account_number);
    setAccountName(b.account_name);
    setResolveError("");
  };

  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) resolveAccount();
    else { resolveVersion.current += 1; setResolving(false); setAccountName(""); setResolveError(""); }
    submissionKey.current = null;
  }, [accountNumber, bankCode]);

  useEffect(() => {
    if (step === "amount") calculateWithdrawable();
  }, [step]);

  const loadWithdrawalHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setWithdrawals((data as Withdrawal[]) || []);
    setLoadingHistory(false);
  };

  const resolveAccount = async () => {
    const version = ++resolveVersion.current;
    setResolving(true); setAccountName(""); setResolveError("");
    try {
      const data = await enquireAccount({ data: { accountNumber, bankCode } });
      if (version === resolveVersion.current) setAccountName(data.account_name);
    } catch (e: any) {
      if (version === resolveVersion.current) setResolveError(e.message);
    }
    if (version === resolveVersion.current) setResolving(false);
  };

  const calculateWithdrawable = async () => {
    setLoadingBalance(true);
    setWithdrawableBalance(wallet?.balance ?? 0);
    setLoadingBalance(false);
  };

  const netNum = Number(receiveAmount) || 0;
  const breakdown = withdrawalBreakdown(netNum);
  const amount = String(breakdown.amount || "");
  const amountNum = breakdown.amount;
  const totalDebit = breakdown.totalDebit;
  const fee = breakdown.totalCharges;
  const netReceive = breakdown.netReceive;

  const proceedToAmount = () => {
    if (!accountName) { toast.error("Please wait for account verification"); return; }
    setStep("amount");
  };

  const proceedToConfirm = () => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) { toast.error("Enter a valid amount"); return; }
    if (netNum < MIN_WITHDRAWAL) { toast.error(`Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`); return; }
    if (num > MAX_WITHDRAWAL) { toast.error(`Maximum withdrawal is ₦${MAX_WITHDRAWAL.toLocaleString()}`); return; }
    if (totalDebit > (wallet?.balance ?? 0)) {
      toast.error(`You need ${fmtNaira(totalDebit)} total (${fmtNaira(num)} + ${fmtNaira(fee)} fee)`);
      return;
    }
    setStep("confirm");
  };

  const proceedToPin = () => { setPin(""); setStep("pin"); };

  const submitWithdrawal = async (entered?: string) => {
    const usePin = entered ?? pin;
    if (usePin.length !== 4 || submitting.current) return;
    if (resolving) { toast.error("Still verifying the account. Please wait a moment."); return; }
    if (!selectedBank || !accountName) {
      toast.error("Please reselect the bank and account, then try again.");
      setPin(""); setStep("bank"); return;
    }
    submitting.current = true;
    if (!submissionKey.current) submissionKey.current = crypto.randomUUID();
    setLoading(true);
    try {
      const data = await sendWithdrawal({
        data: {
          bankCode: selectedBank.code, accountNumber,
          amount: Number(amount), pin: usePin, idempotencyKey: submissionKey.current,
        },
      });
      setWithdrawalRef(data.reference);
      withdrawalRefForPoll.current = data.reference;
      setWdStatus(data.status);
      setSubmittedNet(Number(data.net_payout ?? netReceive));
      setStep("success");
      setPin("");
      void refreshWallet().catch(() => {});
      loadWithdrawalHistory();
      toast.success("Withdrawal submitted!");
    } catch (e: any) {
      toast.error(e?.message || "Withdrawal failed. Please try again.");
      setPin("");
      if (/incorrect pin/i.test(e.message)) {
        setPin("");
        setPinError(true);
        setTimeout(() => setPinError(false), 600);
      }
    }
    setLoading(false);
    submitting.current = false;
  };

  const getReceiptData = () => {
    const now = new Date();
    return {
      type: "Withdrawal",
      amount: `₦${Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
      status: receiptStatus(wdStatus),
      date: format(now, "MMM d, yyyy"),
      time: format(now, "h:mm a"),
      reference: withdrawalRef,
      bankName: selectedBank?.name,
      bankLogoUrl: selectedBank?.logo
        || (selectedBank ? getBankLogoUrlSync({ code: selectedBank.code, name: selectedBank.name }) : undefined),
      rows: [
        { label: "Bank", value: selectedBank?.name || "" },
        { label: "Account", value: accountNumber },
        { label: "Name", value: accountName },
        { label: "Bank receives", value: `₦${submittedNet.toLocaleString("en-NG", { minimumFractionDigits: 2 })}` },
        { label: "Transfer fee", value: `₦${fee.toLocaleString("en-NG", { minimumFractionDigits: 2 })}` },
        { label: "Total from wallet", value: `₦${totalDebit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}` },
        { label: "Reference", value: withdrawalRef },
      ],
    };
  };

  const shareReceipt = async () => {
    await shareReceiptImage(getReceiptData(), `kuka-withdrawal-${withdrawalRef.slice(0, 12)}.png`);
    toast.success("Receipt shared!");
  };

  const downloadImageReceipt = async () => {
    await downloadReceiptImage(getReceiptData(), `kuka-withdrawal-${withdrawalRef.slice(0, 12)}.png`);
    toast.success("Image receipt downloaded!");
  };

  const downloadPdfReceipt = async () => {
    await downloadReceiptPdf(getReceiptData(), `kuka-withdrawal-${withdrawalRef.slice(0, 12)}.pdf`);
    toast.success("PDF receipt downloaded!");
  };

  const saveBeneficiary = async () => {
    if (!user || !accountName || !accountNumber || !bankCode || !selectedBank) return;
    try {
      const { error } = await supabase.from("saved_beneficiaries").insert({
        user_id: user.id,
        account_name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        bank_name: selectedBank.name,
      });
      if (error) {
        if (error.code === "23505") toast.info("Already saved as beneficiary");
        else toast.error("Failed to save beneficiary");
      } else {
        toast.success("Saved as beneficiary!");
        loadBeneficiaries();
      }
    } catch {
      toast.error("Failed to save beneficiary");
    }
  };

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending" || w.status === "processing");
  const filteredHistory = withdrawals.filter((w) => {
    if (historyFilter !== "all" && w.status !== historyFilter) return false;
    if (historySearch) {
      const s = historySearch.toLowerCase();
      if (!w.account_name.toLowerCase().includes(s) && !w.bank_name.toLowerCase().includes(s) && !(w.reference || w.provider_reference || w.flutterwave_transfer_ref || "").toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const goBack = () => {
    if (step === "bank") navigate(-1);
    else if (step === "amount") setStep("bank");
    else if (step === "confirm") setStep("amount");
    else if (step === "pin") setStep("confirm");
    else navigate("/");
  };

  // If in withdrawal flow (past bank step), show full screen flow
  if (mainTab === "withdraw" && step !== "bank") {
    return (
      <div className="px-5 pt-10 pb-8 space-y-5 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold">{step === "success" ? "Withdrawal Submitted" : "Withdraw"}</h1>
        </div>

        {/* AMOUNT */}
        {step === "amount" && (() => {
          const balance = wallet?.balance ?? 0;
          const insufficient = amountNum > 0 && totalDebit > balance;
          const belowMin = netNum > 0 && netNum < MIN_WITHDRAWAL;
          const aboveMax = amountNum > MAX_WITHDRAWAL;
          const canContinue = netNum > 0 && !insufficient && !belowMin && !aboveMax;
          return (
            <div className="space-y-6">
              {/* Wallet balance pill */}
              <div className="rounded-2xl border bg-card px-4 py-3 flex items-center justify-between shadow-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Wallet balance</span>
                <span className="font-mono-num font-semibold text-sm">
                  ₦{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Hero question + input */}
              <div className="space-y-4 pt-2">
                <h2 className="text-lg font-semibold leading-snug text-center px-2">
                  How much do you want to receive<br/>in your bank account?
                </h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-semibold text-muted-foreground">₦</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    placeholder="0"
                    value={receiveAmount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d.]/g, "");
                      setReceiveAmount(v);
                      submissionKey.current = null;
                    }}
                    className="bg-transparent border-0 outline-none text-5xl font-bold font-mono-num text-center tracking-tight w-full max-w-[260px] focus:ring-0 placeholder:text-muted-foreground/30"
                  />
                </div>
                <div className="mx-auto h-px w-40 bg-border" />
                <p className="text-[11px] text-muted-foreground text-center">
                  Min ₦{MIN_WITHDRAWAL.toLocaleString()} · Max ₦{MAX_WITHDRAWAL.toLocaleString()}
                </p>
              </div>

              {/* Breakdown card */}
              {netNum > 0 && (
                <div className="rounded-2xl border bg-card shadow-sm overflow-hidden divide-y divide-border/60 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between px-4 py-4">
                    <span className="text-sm text-muted-foreground">Amount to receive</span>
                    <span className="font-mono-num font-bold text-xl text-accent">
                      {fmtNaira(breakdown.netReceive)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">{breakdown.flat ? "Flat transfer fee" : "Transfer fee"}</span>
                    <span className="font-mono-num text-sm">+{fmtNaira(breakdown.totalCharges)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-4 bg-muted/30">
                    <div>
                      <p className="text-sm font-semibold">Total from wallet</p>
                      <p className="text-[11px] text-muted-foreground">transfer + fee</p>
                    </div>
                    <span className="font-mono-num font-bold text-base">{fmtNaira(breakdown.totalDebit)}</span>
                  </div>
                </div>
              )}

              {/* Inline validation */}
              {insufficient && (
                <p className="text-xs text-destructive text-center -mt-2">
                  You need {fmtNaira(totalDebit)} total ({fmtNaira(amountNum)} + {fmtNaira(fee)} fee).
                </p>
              )}
              {netNum === 0 && balance > 0 && (
                <button
                  type="button"
                  onClick={() => setReceiveAmount(String(maxWithdrawableFor(Math.min(balance, MAX_WITHDRAWAL + MAX_WITHDRAWAL_FEE))))}
                  className="mx-auto block text-xs font-semibold text-primary"
                >
                  Send max ({fmtNaira(maxWithdrawableFor(Math.min(balance, MAX_WITHDRAWAL + MAX_WITHDRAWAL_FEE)))})
                </button>
              )}
              {belowMin && !insufficient && (
                <p className="text-xs text-destructive text-center -mt-2">
                  Minimum receive amount is ₦{MIN_WITHDRAWAL.toLocaleString()}
                </p>
              )}
              {aboveMax && (
                <p className="text-xs text-destructive text-center -mt-2">
                  Maximum withdrawal is ₦{MAX_WITHDRAWAL.toLocaleString()}
                </p>
              )}

              <p className="text-[11px] text-muted-foreground text-center">
                Transfers to other KukaPay users are always free.
              </p>

              <Button
                onClick={proceedToConfirm}
                disabled={!canContinue}
                className="w-full gap-2"
                size="lg"
              >
                Confirm Withdrawal
              </Button>
            </div>
          );
        })()}


        {/* CONFIRM */}
        {step === "confirm" && (
          <div className="space-y-5">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-semibold text-center">Confirm Withdrawal</h2>
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-semibold">{selectedBank?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-mono-num">{accountNumber}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold">{accountName}</span></div>
                  <hr className="border-border" />
                  <div className="flex justify-between font-mono-num"><span className="text-muted-foreground">Transfer amount</span><span>{fmtNaira(breakdown.amount)}</span></div>
                  <div className="flex justify-between font-mono-num"><span className="text-muted-foreground">{breakdown.flat ? "Flat transfer fee" : "Transfer fee"}</span><span>+{fmtNaira(breakdown.flutterwave + breakdown.platform)}</span></div>
                  {breakdown.stampDuty > 0 && (
                    <div className="flex justify-between font-mono-num"><span className="text-muted-foreground">Stamp duty</span><span>+{fmtNaira(breakdown.stampDuty)}</span></div>
                  )}
                  <hr className="border-border" />
                  <div className="flex justify-between"><span className="text-muted-foreground">Total from wallet</span><span className="font-mono-num font-semibold">{fmtNaira(breakdown.totalDebit)}</span></div>
                  <div className="flex justify-between"><span className="font-semibold">Bank receives</span><span className="font-mono-num font-bold text-lg text-accent">{fmtNaira(breakdown.netReceive)}</span></div>
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
              onComplete={submitWithdrawal}
              title="Enter Transaction PIN"
              subtitle="Enter your 4-digit PIN to authorize"
              loading={loading}
              error={pinError}
            />
            {loading && <div className="flex justify-center mt-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
          </div>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <div className="flex flex-col items-center text-center space-y-5 pt-4">
            <div className="h-20 w-20 rounded-full bg-accent/15 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-accent" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">
                {wdStatus === "completed" ? "Payment Successful!" : wdStatus === "failed" || wdStatus === "refunded" || wdStatus === "reversed" ? "Withdrawal Failed" : "Withdrawal Submitted!"}
              </h2>
              <p className="text-3xl font-mono-num font-bold text-primary">₦{Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-muted-foreground">
                {wdStatus === "completed" ? `Sent to ${accountName}` : wdStatus === "refunded" || wdStatus === "reversed" ? "Your amount and fee have been returned to your wallet" : wdStatus === "failed" ? "Please contact support to check your withdrawal" : "Your transfer is awaiting bank confirmation"}
              </p>
            </div>
            <Card className="w-full">
              <CardContent className="p-4 space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Reference</span>
                  <button onClick={() => { navigator.clipboard.writeText(withdrawalRef); toast.success("Copied"); }} className="flex items-center gap-1 font-mono-num text-xs text-primary">
                    {withdrawalRef.slice(0, 18)}… <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span>{selectedBank?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-mono-num">{accountNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold">{accountName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">You receive</span><span className="font-mono-num font-bold text-accent">₦{submittedNet.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-xs">{new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                  {wdStatus === "completed" ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent"><CheckCircle className="h-3 w-3" /> Successful</span>
                  ) : wdStatus === "failed" || wdStatus === "refunded" || wdStatus === "reversed" ? (
                    <span className="text-xs font-semibold text-destructive">Failed · Refunded</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold"><Clock className="h-3 w-3" /> In progress</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="space-y-3 w-full">
              <Button variant="outline" className="w-full gap-1.5" onClick={saveBeneficiary}>
                <CheckCircle className="h-4 w-4" /> Save as Beneficiary
              </Button>
              <p className="text-xs text-muted-foreground text-center font-medium">Download Receipt</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-1.5" onClick={downloadImageReceipt}>
                  <Image className="h-4 w-4" /> Image
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={downloadPdfReceipt}>
                  <FileText className="h-4 w-4" /> PDF
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-1.5" onClick={shareReceipt}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
                <Button className="gap-1.5" onClick={() => navigate("/")}>Done</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.trim().toLowerCase())
  );

  if (bankPickerOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col max-w-md mx-auto">
        <div className="px-5 pt-10 pb-3 flex items-center gap-3 border-b border-border">
          <button onClick={() => setBankPickerOpen(false)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold">Select Bank</h1>
        </div>
        <div className="px-5 py-3 border-b border-border bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search bank..."
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loadingBanks ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filteredBanks.length === 0 ? (
            <EmptyState icon={Search} title="No banks found" description="Try a different search term." />
          ) : (
            <ul className="divide-y divide-border">
              {filteredBanks.map((bank) => {
                const active = bank.code === bankCode;
                return (
                  <li key={bank.code}>
                    <button
                      onClick={() => {
                        setBankCode(bank.code);
                        setAccountName("");
                        setAccountNumber("");
                        setResolveError("");
                        setBankPickerOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/40 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-white border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {bank.logo ? (
                          <>
                            <img
                              src={bank.logo}
                              alt=""
                              className="h-8 w-8 object-contain"
                              onError={(e) => {
                                const el = e.currentTarget;
                                el.style.display = "none";
                                const fb = el.nextElementSibling as HTMLElement | null;
                                if (fb) fb.style.display = "flex";
                              }}
                            />
                            <span className="text-sm font-bold text-primary hidden h-full w-full items-center justify-center">{bank.name.charAt(0).toUpperCase()}</span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-primary flex h-full w-full items-center justify-center">{bank.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="flex-1 text-sm font-medium truncate">{bank.name}</span>
                      {active && <CheckCircle className="h-4 w-4 text-accent shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-8 space-y-5 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Withdraw</h1>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="pending">
            Pending {pendingWithdrawals.length > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[9px]">{pendingWithdrawals.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ── WITHDRAW TAB ── */}
        <TabsContent value="withdraw" className="space-y-4">
          {/* Save on fees notice */}
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-accent shrink-0" />
                <p className="text-xs font-semibold text-accent">Save on fees</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Send money to other KukaPay users for free and avoid withdrawal processing fees.
              </p>
            </CardContent>
          </Card>

          {/* Saved Beneficiaries */}
          {!loadingBeneficiaries && beneficiaries.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Saved Beneficiaries</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {beneficiaries.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => selectBeneficiary(b)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      accountNumber === b.account_number && bankCode === b.bank_code
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/30 hover:bg-muted/60"
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {b.is_favorite ? <Star className="h-4 w-4 text-primary fill-primary" /> : <User className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{b.nickname || b.account_name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono-num">{b.bank_name} · {b.account_number}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <hr className="flex-1 border-border" />
                <span className="text-[11px]">or enter manually</span>
                <hr className="flex-1 border-border" />
              </div>
            </div>
          )}

          {/* Bank details form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Bank</label>
              <button
                type="button"
                onClick={() => { setBankSearch(""); setBankPickerOpen(true); }}
                disabled={loadingBanks}
                className="w-full flex items-center justify-between px-3 h-11 rounded-md border border-input bg-background text-left text-sm hover:bg-muted/40 transition-colors disabled:opacity-60"
              >
                {loadingBanks ? (
                  <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading banks...</span>
                ) : selectedBank ? (
                  <span className="font-medium truncate">{selectedBank.name}</span>
                ) : (
                  <span className="text-muted-foreground">Choose your bank</span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Number</label>
              <Input type="text" inputMode="numeric" placeholder="0123456789" maxLength={10} value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} />
            </div>
            {resolving && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Verifying account...</div>}
            {resolveError && <div className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4" /> {resolveError}</div>}
            {accountName && (
              <Card className="border-accent/30 bg-accent/5">
                <CardContent className="p-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{accountName}</p>
                    <p className="text-xs text-muted-foreground">{selectedBank?.name}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Button onClick={proceedToAmount} className="w-full" size="lg" disabled={!accountName}>Continue</Button>
          </div>
        </TabsContent>

        {/* ── PENDING TAB ── */}
        <TabsContent value="pending" className="space-y-4">
          {loadingHistory ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : pendingWithdrawals.length === 0 ? (
            <EmptyState icon={Clock} title="No pending withdrawals" description="All your withdrawals have been processed." />
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.map((w) => {
                const style = STATUS_STYLES[w.status] || STATUS_STYLES.pending;
                return (
                  <Card key={w.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{w.bank_name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono-num">{w.account_number} · {w.account_name}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{style.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono-num font-bold">₦{Number(w.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                        <span className="text-[11px] text-muted-foreground">{format(new Date(w.created_at), "MMM d, h:mm a")}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── HISTORY TAB ── */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Search history..." className="pl-9 h-10" />
            </div>
            <select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          {loadingHistory ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filteredHistory.length === 0 ? (
            <EmptyState icon={Clock} title="No withdrawals yet" description="Your past withdrawals will appear here." />
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((w) => {
                const style = STATUS_STYLES[w.status] || STATUS_STYLES.pending;
                return (
                  <Card key={w.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{w.bank_name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono-num">{w.account_number}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(w.created_at), "MMM d, h:mm a")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono-num font-bold">₦{Number(w.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{style.label}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WithdrawalPage;
