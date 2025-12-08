import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Handshake, RotateCcw, Home, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface ChallengeResultsProps {
  isWinner: boolean;
  isDraw: boolean;
  yourScore: number;
  opponentScore: number;
  totalQuestions: number;
  opponentName: string;
  streakChange: number;
  newStreak: number;
  onRematch: () => void;
  onGoHome: () => void;
}

export const ChallengeResults: React.FC<ChallengeResultsProps> = ({
  isWinner,
  isDraw,
  yourScore,
  opponentScore,
  totalQuestions,
  opponentName,
  streakChange,
  newStreak,
  onRematch,
  onGoHome,
}) => {
  useEffect(() => {
    if (isWinner) {
      // Victory confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22c55e', '#16a34a', '#15803d'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#22c55e', '#16a34a', '#15803d'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isWinner]);

  return (
    <div className="max-w-md mx-auto p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <Card className={`p-8 text-center ${
          isWinner
            ? 'border-green-500/50 bg-gradient-to-b from-green-500/10 to-transparent'
            : isDraw
              ? 'border-yellow-500/50 bg-gradient-to-b from-yellow-500/10 to-transparent'
              : 'border-destructive/50 bg-gradient-to-b from-destructive/10 to-transparent'
        }`}>
          {/* Result Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mb-6"
          >
            {isWinner ? (
              <Trophy className="w-20 h-20 mx-auto text-yellow-500" />
            ) : isDraw ? (
              <Handshake className="w-20 h-20 mx-auto text-yellow-500" />
            ) : (
              <Medal className="w-20 h-20 mx-auto text-muted-foreground" />
            )}
          </motion.div>

          {/* Result Title */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-3xl font-bold mb-2 ${
              isWinner ? 'text-green-500' : isDraw ? 'text-yellow-500' : 'text-muted-foreground'
            }`}
          >
            {isWinner ? 'VICTORY!' : isDraw ? "IT'S A DRAW!" : 'DEFEAT'}
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-8"
          >
            {isWinner
              ? `You defeated ${opponentName}!`
              : isDraw
                ? 'Both players tied!'
                : `${opponentName} wins this round`}
          </motion.p>

          {/* Score comparison */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center items-center gap-8 mb-8"
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-veno-primary">{yourScore}</div>
              <div className="text-sm text-muted-foreground">You</div>
            </div>
            <div className="text-2xl text-muted-foreground">vs</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-muted-foreground">{opponentScore}</div>
              <div className="text-sm text-muted-foreground">{opponentName}</div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">Accuracy</div>
              <div className="text-xl font-bold">
                {Math.round((yourScore / totalQuestions) * 100)}%
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">Current Streak</div>
              <div className="text-xl font-bold flex items-center justify-center gap-1">
                {newStreak}
                {streakChange > 0 && (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Streak change indicator */}
          {streakChange > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-500 mb-6"
            >
              <TrendingUp className="w-4 h-4" />
              Streak +{streakChange}!
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex gap-3"
          >
            <Button variant="outline" onClick={onGoHome} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Back to Hub
            </Button>
            <Button
              onClick={onRematch}
              className="flex-1 bg-veno-primary hover:bg-veno-primary/90"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Rematch
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};
