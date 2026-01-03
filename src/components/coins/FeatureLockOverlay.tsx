import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Coins, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoinService, FEATURE_COSTS } from '@/services/coinService';
import { useToast } from '@/hooks/use-toast';

interface FeatureLockOverlayProps {
  featureType: keyof typeof FEATURE_COSTS;
  featureName: string;
  userBalance: number;
  onUnlock?: () => void;
  onSubscribe?: () => void;
}

export const FeatureLockOverlay: React.FC<FeatureLockOverlayProps> = ({
  featureType,
  featureName,
  userBalance,
  onUnlock,
  onSubscribe
}) => {
  const { toast } = useToast();
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const cost = FEATURE_COSTS[featureType];
  const hasEnoughCoins = userBalance >= cost;

  const handleUnlockWithCoins = async () => {
    if (!hasEnoughCoins) return;
    
    setIsUnlocking(true);
    const result = await CoinService.unlockFeatureWithCoins(featureType);
    setIsUnlocking(false);

    if (result.success) {
      toast({
        title: "Feature Unlocked! 🎉",
        description: `${featureName} is now available for 24 hours.`,
      });
      onUnlock?.();
    } else {
      toast({
        title: "Unlock Failed",
        description: result.error || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="flex flex-col items-center text-center p-6 max-w-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-4 rounded-full bg-primary/10 mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        
        <h3 className="text-xl font-bold mb-2">{featureName}</h3>
        <p className="text-muted-foreground mb-6">
          This is a premium feature. Subscribe or use coins to unlock.
        </p>

        <div className="flex flex-col gap-3 w-full">
          {/* Subscribe Button */}
          <Button
            onClick={onSubscribe}
            className="w-full gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            Subscribe for Full Access
          </Button>

          {/* Coin Unlock Button */}
          <Button
            onClick={handleUnlockWithCoins}
            variant={hasEnoughCoins ? "outline" : "ghost"}
            className={`w-full gap-2 ${!hasEnoughCoins ? 'opacity-60' : ''}`}
            size="lg"
            disabled={!hasEnoughCoins || isUnlocking}
          >
            {isUnlocking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Coins className="h-4 w-4 text-amber-500" />
            )}
            Unlock with {cost} Coins (24h)
          </Button>

          {/* Balance indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">
              Your balance: <span className={hasEnoughCoins ? 'text-amber-500 font-semibold' : 'text-destructive font-semibold'}>{userBalance}</span>
            </span>
          </div>

          {!hasEnoughCoins && (
            <motion.p
              className="text-sm text-muted-foreground mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              🏆 Finish in the top 10 to earn coins and unlock this feature!
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FeatureLockOverlay;
