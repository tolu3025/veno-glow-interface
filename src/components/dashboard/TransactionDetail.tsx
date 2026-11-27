import { useRef, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, Users, Briefcase, CheckCircle,
  Clock, XCircle, Download, Copy, X, Image, FileText, Flag, Loader2,
} from "lucide-react";
import TransactionFeedback from "./TransactionFeedback";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { downloadReceiptImage, downloadReceiptPdf } from "@/lib/receiptGenerator";
import { getBankLogoUrlSync } from "@/lib/bankLogos";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof ArrowDownLeft; isCredit: boolean }> = {
  deposit: { label: "Deposit", icon: ArrowDownLeft, isCredit: true },
  p2p_transfer: { label: "Transfer", icon: ArrowUpRight, isCredit: false },
  withdrawal: { label: "Withdrawal", icon: ArrowUpRight, isCredit: false },
  collection_payment: { label: "Collection", icon: Users, isCredit: false },
  errand_payment: { label: "Errand", icon: Briefcase, isCredit: false },
  ajo_contribution: { label: "Ajo Contribution", icon: ArrowUpRight, isCredit: false },
  ajo_disbursement: { label: "Ajo Payout", icon: ArrowDownLeft, isCredit: true },
};

const STATUS_ICON: Record<string, { icon: typeof CheckCircle; color: string }> = {
  completed: { icon: CheckCircle, color: "text-accent" },
  pending: { icon: Clock, color: "text-yellow-500" },
  failed: { icon: XCircle, color: "text-destructive" },
};

interface TransactionDetailProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground text-right max-w-[60%] truncate">{value}</span>
  </div>
);

const TransactionDetail = ({ transaction, open, onOpenChange }: TransactionDetailProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showFeedback, setShowFeedback] = useState(true);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);

  const handleFlagTransaction = async () => {
    if (!transaction || !disputeReason || disputeDesc.trim().length < 10) {
      toast.error("Select a reason and provide at least 10 characters of description");
      return;
    }
    setDisputeLoading(true);
    try {
      await friendlyInvoke("manage-disputes", {
        body: {
          action: "create_dispute",
          transaction_id: transaction.id,
          reason: disputeReason,
          description: disputeDesc.trim(),
        },
      }, "Failed to submit dispute. Please try again.");
      toast.success("Dispute submitted! Admin will review.");
      setShowDisputeForm(false);
      setDisputeReason("");
      setDisputeDesc("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDisputeLoading(false);
    }
  };
  if (!transaction) return null;

  const config = TYPE_CONFIG[transaction.type] || TYPE_CONFIG.deposit;
  const Icon = config.icon;
  const isCredit = transaction.metadata?.direction === "credit" || config.isCredit;
  const statusInfo = STATUS_ICON[transaction.status] || STATUS_ICON.pending;
  const StatusIcon = statusInfo.icon;

  const copyReference = () => {
    if (transaction.reference) {
      navigator.clipboard.writeText(transaction.reference);
      toast.success("Reference copied!");
    }
  };

  const getReceiptData = () => {
    const dateStr = format(new Date(transaction.created_at), "MMM d, yyyy");
    const timeStr = format(new Date(transaction.created_at), "h:mm:ss a");

    const rows: { label: string; value: string }[] = [
      { label: "Type", value: config.label },
      { label: "Date", value: `${dateStr} · ${timeStr}` },
    ];

    if (transaction.metadata?.description) rows.push({ label: "Description", value: transaction.metadata.description });
    if (transaction.metadata?.recipient_name) rows.push({ label: "Recipient", value: transaction.metadata.recipient_name });
    if (transaction.metadata?.sender_name) rows.push({ label: "From", value: transaction.metadata.sender_name });
    if (transaction.metadata?.bank_name) rows.push({ label: "Bank", value: transaction.metadata.bank_name });
    if (transaction.metadata?.account_number) rows.push({ label: "Account", value: transaction.metadata.account_number });
    if (transaction.metadata?.account_name) rows.push({ label: "Account Name", value: transaction.metadata.account_name });
    if (transaction.metadata?.fee) rows.push({ label: "Fee", value: `₦${Number(transaction.metadata.fee).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` });

    rows.push({ label: "Amount", value: `${isCredit ? "+" : "-"}₦${transaction.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}` });
    rows.push({ label: "Status", value: transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1) });

    const bankName: string | undefined = transaction.metadata?.bank_name;
    const bankCode: string | undefined = transaction.metadata?.bank_code;
    const bankLogoUrl = bankName || bankCode
      ? getBankLogoUrlSync({ code: bankCode, name: bankName })
      : undefined;

    return {
      type: config.label,
      amount: `${isCredit ? "+" : "-"}₦${transaction.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
      status: transaction.status,
      date: dateStr,
      time: timeStr,
      reference: transaction.reference || undefined,
      transactionId: transaction.id,
      bankName,
      bankLogoUrl,
      rows,
    };
  };

  const fileBase = `kuka-receipt-${transaction.reference || transaction.id.slice(0, 8)}`;

  const handleDownloadImage = async () => {
    await downloadReceiptImage(getReceiptData(), `${fileBase}.png`);
    toast.success("Image receipt downloaded!");
  };

  const handleDownloadPdf = async () => {
    await downloadReceiptPdf(getReceiptData(), `${fileBase}.pdf`);
    toast.success("PDF receipt downloaded!");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg">Transaction Details</DrawerTitle>
            <DrawerClose asChild>
              <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div ref={receiptRef} className="px-5 pb-6 space-y-5">
          {/* Amount Hero */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
              isCredit ? "bg-accent/15" : "bg-primary/10"
            }`}>
              <Icon className={`h-6 w-6 ${isCredit ? "text-accent" : "text-primary"}`} />
            </div>
            <p className={`text-3xl font-bold font-mono-num ${isCredit ? "text-accent" : "text-foreground"}`}>
              {isCredit ? "+" : "-"}₦{transaction.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
              transaction.status === "completed" ? "bg-accent/10" :
              transaction.status === "pending" ? "bg-yellow-500/10" : "bg-destructive/10"
            }`}>
              <StatusIcon className={`h-3.5 w-3.5 ${statusInfo.color}`} />
              <span className={`text-xs font-semibold capitalize ${statusInfo.color}`}>
                {transaction.status}
              </span>
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-0.5">
            <DetailRow label="Type" value={config.label} />
            <DetailRow
              label="Date"
              value={format(new Date(transaction.created_at), "MMM d, yyyy · h:mm a")}
            />
            {transaction.metadata?.description && (
              <DetailRow label="Description" value={transaction.metadata.description} />
            )}
            {transaction.metadata?.recipient_name && (
              <DetailRow label="Recipient" value={transaction.metadata.recipient_name} />
            )}
            {transaction.metadata?.sender_name && (
              <DetailRow label="From" value={transaction.metadata.sender_name} />
            )}
            {transaction.metadata?.bank_name && (
              <DetailRow label="Bank" value={transaction.metadata.bank_name} />
            )}
            {transaction.metadata?.account_number && (
              <DetailRow label="Account" value={transaction.metadata.account_number} />
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownloadImage}
              className="gap-2"
              variant="outline"
            >
              <Image className="h-4 w-4" /> Image
            </Button>
            <Button
              onClick={handleDownloadPdf}
              className="gap-2"
              variant="default"
            >
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>

          {/* Flag Transaction */}
          {transaction.status === "completed" && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive gap-1.5 text-xs"
              onClick={() => setShowDisputeForm(true)}
            >
              <Flag className="h-3.5 w-3.5" /> Flag this transaction
            </Button>
          )}

          {/* Feedback section for completed transactions */}
          {transaction.status === "completed" && showFeedback && (
            <>
              <Separator />
              <TransactionFeedback
                transactionId={transaction.id}
                onSubmitted={() => setShowFeedback(false)}
              />
            </>
          )}

          {/* Dispute Dialog */}
          <Dialog open={showDisputeForm} onOpenChange={setShowDisputeForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Flag Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={disputeReason} onValueChange={setDisputeReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wrong_recipient">Wrong Recipient</SelectItem>
                    <SelectItem value="duplicate">Duplicate Transaction</SelectItem>
                    <SelectItem value="fraud">Suspected Fraud</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Describe the issue (min 10 characters)..."
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  maxLength={500}
                />
                <Button
                  className="w-full"
                  onClick={handleFlagTransaction}
                  disabled={disputeLoading || !disputeReason || disputeDesc.trim().length < 10}
                >
                  {disputeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Dispute"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionDetail;
