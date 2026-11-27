import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowUpFromLine, Repeat, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import LiveCryptoRates from "@/components/wallet/LiveCryptoRates";

const formatNaira = (n: number) =>
  n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const WalletPage = () => {
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const [hold, setHold] = useState(0);

  useEffect(() => {
    setHold(Number((wallet as any)?.hold_balance ?? 0));
  }, [wallet]);

  const total = Number(wallet?.balance ?? 0);
  // Guard against any historical drift: available can never exceed total.
  const rawAvail = Number((wallet as any)?.available_balance ?? wallet?.balance ?? 0);
  const available = Math.min(rawAvail, total);

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-28 space-y-6">
      <header className="min-w-0">
        <h1 className="text-[26px] font-bold tracking-tightish truncate">Wallet</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Manage your money</p>
      </header>

      <div className="space-y-6">
        {/* Balance breakdown */}
        <div className="rounded-3xl bg-grad-wallet p-5 shadow-soft">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground/60">
            Total Balance
          </p>
          <p className="font-mono-num text-[32px] font-bold tracking-tightish leading-tight">
            ₦{formatNaira(total)}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-foreground/10 text-[12px]">
            <div>
              <p className="text-foreground/60">Available</p>
              <p className="font-mono-num font-semibold">₦{formatNaira(available)}</p>
            </div>
            {hold > 0 && (
              <div className="text-right">
                <p className="text-foreground/60">Pending withdrawal</p>
                <p className="font-mono-num font-semibold">₦{formatNaira(hold)}</p>
              </div>
            )}
          </div>
          <p className="text-[10px] text-foreground/50 mt-2">Updated just now</p>
        </div>

        {/* Primary actions */}
        <div className="grid grid-cols-3 gap-2.5">
          <ActionPill icon={Plus}            label="Add"      onClick={() => navigate("/add-money")} tone="primary" />
          <ActionPill icon={ArrowUpFromLine} label="Withdraw" onClick={() => navigate("/withdraw")}  tone="accent" />
          <ActionPill icon={Repeat}          label="Convert"  onClick={() => navigate("/wallet/convert-crypto")} tone="neutral" />
        </div>

        {/* Live crypto rates (Breet) */}
        <LiveCryptoRates />

        {/* Transactions live on their own page */}
        <button
          onClick={() => navigate("/transactions")}
          className="w-full h-12 rounded-2xl bg-card border border-border text-[13px] font-semibold flex items-center justify-center gap-1.5 press-scale"
        >
          View all transactions <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
};

const ActionPill = ({
  icon: Icon, label, onClick, tone,
}: {
  icon: typeof Plus; label: string; onClick: () => void;
  tone: "primary" | "accent" | "neutral";
}) => {
  const cls =
    tone === "primary" ? "bg-primary text-primary-foreground" :
    tone === "accent"  ? "bg-accent text-accent-foreground"   :
                         "bg-card text-foreground border border-border";
  return (
    <button
      onClick={onClick}
      className={cn("h-14 rounded-2xl flex items-center justify-center gap-1.5 text-[13px] font-semibold press-scale shadow-soft active:scale-[0.97] transition-transform", cls)}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
      <span className="truncate">{label}</span>
    </button>
  );
};

export default WalletPage;
