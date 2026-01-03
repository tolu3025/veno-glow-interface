import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';
import { CoinService } from '@/services/coinService';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface CoinDisplayProps {
  variant?: 'compact' | 'full';
  className?: string;
  showAnimation?: boolean;
  onClick?: () => void;
}

export const CoinDisplay: React.FC<CoinDisplayProps> = ({
  variant = 'compact',
  className,
  showAnimation = true,
  onClick
}) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [showIncrement, setShowIncrement] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    const newBalance = await CoinService.getCoinBalance();
    
    if (showAnimation && newBalance > previousBalance && previousBalance > 0) {
      setIncrementAmount(newBalance - previousBalance);
      setShowIncrement(true);
      setTimeout(() => setShowIncrement(false), 2000);
    }
    
    setPreviousBalance(balance);
    setBalance(newBalance);
  };

  if (!user) return null;

  if (variant === 'compact') {
    return (
      <motion.div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors",
          className
        )}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Coins className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-semibold text-amber-500">{balance}</span>
        
        <AnimatePresence>
          {showIncrement && (
            <motion.span
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-green-500 font-bold text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              +{incrementAmount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20",
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02 } : undefined}
    >
      <div className="p-3 rounded-full bg-amber-500/20">
        <Coins className="h-6 w-6 text-amber-500" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Your Coins</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-amber-500">{balance}</span>
          
          <AnimatePresence>
            {showIncrement && (
              <motion.span
                className="text-green-500 font-bold text-lg"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                +{incrementAmount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default CoinDisplay;
