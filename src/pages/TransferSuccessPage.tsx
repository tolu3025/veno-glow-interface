import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, Share2, Home, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";

interface TransferReceiptState {
  amount: number;
  recipientName: string;
  recipientUniversity?: string;
  reference: string;
  note?: string;
  time: string; // ISO
  newBalance?: number;
}

const TransferSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || null) as TransferReceiptState | null;

  useEffect(() => {
    if (!state?.reference) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  if (!state?.reference) return null;

  const time = new Date(state.time);
  const amountText = state.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });

  const copyRef = () => {
    navigator.clipboard.writeText(state.reference);
    toast.success("Reference copied");
  };

  const shareReceipt = () => {
    const text = `KukaPay Transfer Receipt\n\nAmount: ₦${amountText}\nTo: ${state.recipientName}\nRef: ${state.reference}\nDate: ${format(time, "MMM d, yyyy · h:mm a")}\nFee: ₦0.00\nStatus: Completed`;
    if (navigator.share) {
      navigator.share({ title: "Transfer Receipt", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Receipt copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 px-5 pt-14 pb-8 max-w-md mx-auto w-full flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
          <div className="relative h-24 w-24 rounded-full bg-accent/15 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-accent" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
          <p className="text-4xl font-mono-num font-bold text-primary">₦{amountText}</p>
          <p className="text-sm text-muted-foreground">
            sent to <span className="font-semibold text-foreground">{state.recipientName}</span>
          </p>
        </div>

        <Card className="w-full text-left">
          <CardContent className="p-5 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Reference</span>
              <button onClick={copyRef} className="flex items-center gap-1.5 font-mono-num text-xs text-primary">
                {state.reference} <Copy className="h-3 w-3" />
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-semibold">{state.recipientName}</span>
            </div>
            {state.recipientUniversity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Institution</span>
                <span className="text-xs">{state.recipientUniversity}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee</span>
              <span className="text-accent font-semibold">₦0.00 (Free)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-mono-num text-xs">{format(time, "MMM d, yyyy · h:mm:ss a")}</span>
            </div>
            {state.note && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Note</span>
                <span className="text-right max-w-[60%] truncate">{state.note}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="flex items-center gap-1 text-accent text-xs font-semibold">
                <CheckCircle2 className="h-3 w-3" /> Completed · Instant
              </span>
            </div>
            {typeof state.newBalance === "number" && (
              <>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Balance</span>
                  <span className="font-mono-num font-bold">
                    ₦{state.newBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="w-full space-y-3 pt-2">
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={shareReceipt}>
              <Share2 className="h-4 w-4" /> Share Receipt
            </Button>
            <Button className="flex-1 gap-1.5" onClick={() => navigate("/", { replace: true })}>
              <Home className="h-4 w-4" /> Done
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full gap-1.5 text-muted-foreground"
            onClick={() => navigate("/send", { replace: true })}
          >
            <Send className="h-4 w-4" /> Send Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransferSuccessPage;
