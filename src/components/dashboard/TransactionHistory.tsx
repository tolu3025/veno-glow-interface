import { useState, useEffect } from "react";
import { ArrowDownLeft, ArrowUpRight, Users, Zap, Briefcase, Filter, RefreshCcw, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";
import TransactionDetail from "./TransactionDetail";

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
  bill_payment: { label: "Airtime / Data", icon: Smartphone, isCredit: false },
  ajo_contribution: { label: "Ajo Contribution", icon: ArrowUpRight, isCredit: false },
  ajo_disbursement: { label: "Ajo Payout", icon: ArrowDownLeft, isCredit: true },
  REFUND: { label: "Reversal", icon: ArrowUpRight, isCredit: false },
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposits" },
  { value: "p2p_transfer", label: "Transfers" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "bill_payment", label: "Airtime/Data" },
  { value: "collection_payment", label: "Collections" },
  { value: "errand_payment", label: "Errands" },
];

const STATUS_STYLES: Record<string, string> = {
  completed: "text-accent",
  pending: "text-yellow-500",
  failed: "text-destructive",
};

/** Build a human-readable description for a transaction */
function getDescription(
  tx: Transaction,
  config: { label: string },
  profileMap: Record<string, string>
): string {
  const m = tx.metadata || {};

  if (tx.type === "p2p_transfer") {
    if (m.direction === "credit") {
      const name = profileMap[m.counterparty_id] || m.sender_name || "Someone";
      return `Received from ${name}`;
    }
    const name = profileMap[m.counterparty_id] || m.recipient_name || "Someone";
    return `Sent to ${name}`;
  }

  if (tx.type === "deposit") {
    if (m.source === "breet") {
      return `Crypto conversion · ${m.asset || ""}${m.network ? " · " + m.network : ""}`;
    }
    if (m.purchase_type) {
      const typeLabel = m.purchase_type === "airtime" ? "Airtime" : "Data";
      return `${typeLabel} • ${(m.network || "").toUpperCase()} • ${m.phone || ""}`;
    }
    if (m.sender_name) return `From ${m.sender_name}${m.bank_name ? ` (${m.bank_name})` : ""}`;
    return m.description || "Deposit";
  }

  if (tx.type === "withdrawal") {
    return m.bank_name ? `To ${m.account_name || m.bank_name}` : "Withdrawal";
  }

  if (tx.type === "collection_payment") {
    if (m.direction === "credit") return m.payer_name ? `From ${m.payer_name}` : "Collection received";
    return m.collection_title ? `${m.collection_title}` : "Collection payment";
  }

  if (tx.type === "errand_payment") {
    return m.errand_title || (m.direction === "credit" ? "Errand payout" : "Errand escrow");
  }

  if (tx.type === "bill_payment") {
    const kind = m.purchase_type === "data" ? "Data" : "Airtime";
    if (m.network || m.phone) return `${kind} • ${(m.network || "").toUpperCase()} • ${m.phone || ""}`;
    if (m.bill_type) return `Bill payment · ${m.bill_type}`;
    return `${kind} Purchase`;
  }

  if (tx.type === "ajo_contribution") return m.group_title ? `Ajo: ${m.group_title}` : "Ajo Contribution";
  if (tx.type === "ajo_disbursement") return m.group_title ? `Ajo Payout: ${m.group_title}` : "Ajo Payout";

  return m.description || config.label;
}

const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      setLoading(true);
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter !== "all") {
        query = query.eq("type", filter as any);
      }

      const { data } = await query;
      const txs = (data as Transaction[]) || [];
      setTransactions(txs);

      // Fetch counterparty names for p2p transfers
      const counterpartyIds = new Set<string>();
      txs.forEach((tx) => {
        if (tx.type === "p2p_transfer" && tx.metadata?.counterparty_id) {
          counterpartyIds.add(tx.metadata.counterparty_id);
        }
      });

      if (counterpartyIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", Array.from(counterpartyIds));
        const map: Record<string, string> = {};
        (profiles || []).forEach((p: any) => { map[p.id] = p.full_name; });
        setProfileMap(map);
      }

      setLoading(false);
    };

    fetchTransactions();
  }, [user, filter]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="h-10 w-10 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-2 bg-muted rounded w-16" />
            </div>
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No transactions yet"
          description="Fund your account to get started. Your transaction history will appear here."
          className="py-8"
        />
      ) : (
        <div className="space-y-1">
          {transactions.map((tx) => {
            const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.deposit;
            const Icon = config.icon;
            const isCredit =
              tx.metadata?.direction === "debit" || tx.type === "REFUND"
                ? false
                : tx.metadata?.direction === "credit" || config.isCredit;
            const description = getDescription(tx, config, profileMap);

            return (
              <div key={tx.id} onClick={() => setSelectedTx(tx)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.98]">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isCredit ? "bg-accent/15" : "bg-primary/10"
                }`}>
                  <Icon className={`h-4.5 w-4.5 ${isCredit ? "text-accent" : "text-primary"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">
                      {description}
                    </p>
                    <span className={`text-[10px] font-medium capitalize ${STATUS_STYLES[tx.status] || ""}`}>
                      {tx.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(tx.created_at), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold font-mono-num ${isCredit ? "text-accent" : "text-foreground"}`}>
                    {isCredit ? "+" : "-"}₦{tx.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TransactionDetail
        transaction={selectedTx}
        open={!!selectedTx}
        onOpenChange={(open) => { if (!open) setSelectedTx(null); }}
      />
    </div>
  );
};

export default TransactionHistory;
