import { ArrowLeft, Copy, Share2, Info, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KorapayActivationForm } from "@/components/wallet/KorapayActivationForm";
import { useKorapayAccount } from "@/hooks/useKorapayAccount";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const formatAccountNumber = (num: string) =>
  num.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");

const faqItems = [
  {
    q: "How long does it take?",
    a: "Deposits are usually instant but can take up to 5 minutes depending on your bank.",
  },
  {
    q: "What are the charges?",
    a: "Deposits are credited in full — KukaPay does not deduct any fee. The ₦1,000 minimum still applies.",
  },
  {
    q: "What's the minimum deposit?",
    a: "The minimum deposit is ₦1,000.",
  },
  {
    q: "When is my money available?",
    a: "Your wallet is credited as soon as your bank confirms the transfer. You can withdraw or spend immediately.",
  },
];

const AddMoneyPage = () => {
  const navigate = useNavigate();
  const { profile, user, refreshWallet } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const kycComplete = (profile?.kyc_level ?? 0) >= 1;
  const accountQuery = useKorapayAccount(user?.id, kycComplete);
  const account = accountQuery.data?.status === "ready" && accountQuery.data.account_number ? accountQuery.data : null;
  const accountNumber = account?.account_number;

  const copyAccountNumber = () => {
    if (accountNumber) {
      navigator.clipboard.writeText(accountNumber);
      toast.success("Account number copied!");
    }
  };

  const shareAccountDetails = () => {
    if (!accountNumber) return;
    const text = `Pay me on Kuka Pay!\n\nAccount: ${accountNumber}\nBank: ${account?.bank_name}\nName: ${account?.account_name}`;
    if (navigator.share) {
      navigator.share({ title: "Kuka Pay Account", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Account details copied!");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWallet();
      toast.success("Wallet balance updated!");
    } catch {
      toast.error("Failed to refresh balance.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] pb-28 md:pb-10 space-y-5 max-w-md mx-auto">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate(-1)} className="h-10 w-10 shrink-0 rounded-full bg-muted">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Button>
        <h1 className="text-lg font-bold truncate">Add Money</h1>
      </div>

      {!kycComplete ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-5 space-y-3 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="font-semibold text-base">Complete KYC First</h2>
            <p className="text-sm text-muted-foreground">
              Verify your NIN with Korapay to receive your account number for deposits — it takes less than a minute.
            </p>
            <Button onClick={() => navigate("/kyc")} className="w-full">
              Complete KYC
            </Button>
          </CardContent>
        </Card>
      ) : accountQuery.isPending ? (
        <div role="status" className="flex items-center justify-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading account…</div>
      ) : accountQuery.isError ? (
        <div className="space-y-3 py-6"><p role="alert" className="text-sm text-destructive">We couldn't load your new account. Please try again.</p><Button onClick={() => accountQuery.refetch()}>Try Again</Button></div>
      ) : !accountNumber ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 space-y-3 text-center">
            <CheckCircle className="h-10 w-10 text-primary mx-auto" />
            <h2 className="font-semibold text-base">
              Activate Your Account Number
            </h2>
            <p className="text-sm text-muted-foreground">
              Your existing KYC approval stays valid. Enter your NIN to receive your new account number.
            </p>
            <p className="text-sm text-muted-foreground">Use the NIN linked to your own identity. Do not transfer to your old account number.</p>
            <KorapayActivationForm onActivated={async () => {
              const result = await accountQuery.refetch();
              if (result.error || result.data?.status !== "ready") throw new Error("Account unavailable");
              toast.success("Your account number is ready!");
            }} />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Virtual Account Card */}
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-accent" />
                <p className="text-xs font-semibold text-accent">Your Virtual Account</p>
              </div>

              <div className="text-center space-y-1 py-2">
                <p className="font-mono text-2xl font-bold tracking-wide">
                  {formatAccountNumber(accountNumber)}
                </p>
                <p className="text-sm text-muted-foreground">{account?.bank_name}</p>
                <p className="text-sm font-medium">
                  {account?.account_name}
                </p>
                <p className="text-xs text-muted-foreground">{profile?.full_name}</p>

              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1.5" onClick={copyAccountNumber}>
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <Button variant="outline" className="flex-1 gap-1.5" onClick={shareAccountDetails}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold text-sm">How to Fund Your Wallet</h2>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Open your bank app or visit any bank</li>
                <li>Transfer at least ₦1,000 to the account number above</li>
                <li>Your wallet will be credited automatically</li>
              </ol>
            </CardContent>
          </Card>



          {/* I've sent the money — sticky on mobile */}
          <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] md:static md:bottom-auto z-10">
            <Button onClick={handleRefresh} disabled={refreshing} size="lg" className="w-full gap-2 h-12 shadow-lg md:shadow-none">
              {refreshing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> I've Sent the Money</>
              )}
            </Button>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="font-semibold text-sm mb-2">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible>
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </>
      )}
    </div>
  );
};

export default AddMoneyPage;
