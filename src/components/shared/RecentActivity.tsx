import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SmartAvatar, type BusinessCategory } from "./SmartAvatar";
import TransactionDetail from "@/components/dashboard/TransactionDetail";
import { cn } from "@/lib/utils";

interface Tx {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdraw",
  p2p_transfer: "Transfer",
  airtime: "Airtime",
  ajo_contribution: "Ajo",
  ajo_disbursement: "Ajo",
  collection_payment: "Collect",
  errand_payment: "Errand",
  reversal: "Reversal",
};

const isCredit = (tx: Tx) => {
  if (tx.metadata?.direction === "debit" || tx.type === "REFUND") return false;
  if (tx.type === "deposit" || tx.type === "ajo_disbursement") return true;
  if (tx.metadata?.direction === "credit") return true;
  return false;
};

export const RecentActivity = ({ limit = 6 }: { limit?: number }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Tx[] | null>(null);
  const [selected, setSelected] = useState<Tx | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("transactions")
      .select("id,type,amount,status,reference,metadata,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => setItems((data as Tx[]) ?? []));
  }, [user, limit]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[15px] font-bold tracking-tightish">Recent</h2>
        <button
          onClick={() => navigate("/transactions")}
          className="text-xs font-medium text-primary inline-flex items-center gap-0.5 hover:underline"
        >
          See all <ChevronRight className="h-3 w-3" strokeWidth={1.6} />
        </button>
      </div>

      {items === null ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
              <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
              <div className="h-2.5 w-10 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-5 text-center text-[13px] text-muted-foreground">
          No activity yet
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
          {items.map((tx) => {
            const credit = isCredit(tx);
            const counterpart =
              tx.metadata?.counterparty_name ||
              tx.metadata?.merchant_name ||
              tx.metadata?.sender_name ||
              tx.metadata?.bank_name ||
              TYPE_LABEL[tx.type] ||
              "Tx";
            const firstName = String(counterpart).split(" ")[0];
            const isBusiness = !!(
              tx.metadata?.merchant_name ||
              tx.type === "deposit" ||
              tx.type === "withdrawal" ||
              tx.type === "airtime" ||
              tx.type === "ajo_disbursement" ||
              tx.type === "ajo_contribution"
            );
            const category: BusinessCategory =
              tx.type === "airtime" ? "telecom" :
              tx.type === "deposit" || tx.type === "withdrawal" ? "bank" :
              tx.type === "ajo_disbursement" || tx.type === "ajo_contribution" ? "savings" :
              "merchant";

            return (
              <button
                key={tx.id}
                onClick={() => { setSelected(tx); setDetailOpen(true); }}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] press-scale"
              >
                <div className="relative">
                  <SmartAvatar
                    name={String(counterpart)}
                    kind={isBusiness ? "business" : "person"}
                    category={category}
                    size={52}
                  />
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-background flex items-center justify-center text-[10px] font-bold",
                      credit ? "bg-accent text-accent-foreground" : "bg-foreground/85 text-background",
                    )}
                  >
                    {credit ? "+" : "−"}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-foreground truncate w-full text-center">
                  {firstName}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <TransactionDetail
        transaction={selected as any}
        open={detailOpen}
        onOpenChange={(o) => {
          setDetailOpen(o);
          if (!o) setSelected(null);
        }}
      />
    </div>
  );
};
