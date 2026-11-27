import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TransactionHistory from "@/components/dashboard/TransactionHistory";

const TransactionsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-10 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4.5 w-4.5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold">Transactions</h1>
      </div>
      <TransactionHistory />
    </div>
  );
};

export default TransactionsPage;
