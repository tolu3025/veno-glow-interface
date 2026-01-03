import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Coins, 
  Trophy, 
  Medal, 
  Unlock, 
  Gift,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { CoinService, CoinTransaction } from '@/services/coinService';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CoinHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'challenge_win':
      return <Trophy className="h-4 w-4 text-amber-500" />;
    case 'leaderboard_reward':
      return <Medal className="h-4 w-4 text-yellow-500" />;
    case 'feature_unlock':
      return <Unlock className="h-4 w-4 text-purple-500" />;
    case 'admin_grant':
      return <Gift className="h-4 w-4 text-green-500" />;
    default:
      return <Coins className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTransactionLabel = (type: string) => {
  switch (type) {
    case 'challenge_win':
      return 'Challenge Win';
    case 'leaderboard_reward':
      return 'Leaderboard Reward';
    case 'feature_unlock':
      return 'Feature Unlock';
    case 'admin_grant':
      return 'Bonus Coins';
    default:
      return 'Transaction';
  }
};

export const CoinHistoryModal: React.FC<CoinHistoryModalProps> = ({
  open,
  onOpenChange
}) => {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadTransactions();
    }
  }, [open]);

  const loadTransactions = async () => {
    setLoading(true);
    const data = await CoinService.getTransactionHistory();
    setTransactions(data);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            Coin History
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Coins className="h-12 w-12 mb-2 opacity-30" />
              <p>No transactions yet</p>
              <p className="text-sm">Win challenges to earn coins!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="p-2 rounded-full bg-background">
                    {getTransactionIcon(tx.transaction_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {getTransactionLabel(tx.transaction_type)}
                    </p>
                    {tx.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {tx.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-1 font-bold",
                    tx.amount > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {tx.amount > 0 ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                    {Math.abs(tx.amount)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CoinHistoryModal;
