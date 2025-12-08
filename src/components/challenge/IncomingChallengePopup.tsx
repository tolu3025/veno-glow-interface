import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, BookOpen, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IncomingChallenge } from '@/hooks/useChallengeSubscription';

interface IncomingChallengePopupProps {
  challenge: IncomingChallenge;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingChallengePopup: React.FC<IncomingChallengePopupProps> = ({
  challenge,
  onAccept,
  onDecline,
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const is4MinMode = challenge.challenge.duration_seconds === 240;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDecline]);

  const formatDuration = (seconds: number) => {
    if (seconds === 30) return '30 seconds';
    if (seconds === 60) return '1 minute';
    if (seconds === 120) return '2 minutes';
    if (seconds === 240) return '4 minutes';
    return `${seconds}s`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          is4MinMode ? 'bg-black/80' : 'bg-black/60'
        } backdrop-blur-sm`}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <Card
            className={`relative p-6 max-w-sm w-full ${
              is4MinMode
                ? 'border-2 border-destructive/50 bg-gradient-to-br from-card via-destructive/10 to-card'
                : 'border-veno-primary/50'
            }`}
            style={is4MinMode ? {
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)',
            } : undefined}
          >
            {/* Timer ring */}
            <div className="absolute -top-3 -right-3">
              <div className="relative w-12 h-12">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-muted"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={126}
                    strokeDashoffset={126 - (126 * timeLeft) / 30}
                    className={is4MinMode ? 'text-destructive' : 'text-veno-primary'}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                  {timeLeft}
                </span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-4">
              <motion.div
                animate={is4MinMode ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Zap className={`w-10 h-10 mx-auto mb-2 ${is4MinMode ? 'text-destructive' : 'text-veno-primary'}`} />
              </motion.div>
              <h3 className="text-xl font-bold">
                {is4MinMode ? '⚡ High-Stakes Challenge!' : 'Challenge Incoming!'}
              </h3>
            </div>

            {/* Challenger info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Challenger</span>
                <span className="font-semibold">{challenge.hostUsername}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Subject
                </span>
                <span className="font-semibold">{challenge.challenge.subject}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Duration
                </span>
                <span className={`font-semibold ${is4MinMode ? 'text-destructive' : ''}`}>
                  {formatDuration(challenge.challenge.duration_seconds)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Difficulty</span>
                <span className={`font-semibold capitalize ${
                  challenge.challenge.difficulty === 'expert' ? 'text-destructive' :
                  challenge.challenge.difficulty === 'hard' ? 'text-orange-500' :
                  challenge.challenge.difficulty === 'medium' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {challenge.challenge.difficulty}
                </span>
              </div>
            </div>

            {is4MinMode && (
              <motion.p
                className="text-center text-sm text-destructive mb-4"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ⚠️ AI Difficulty Boost Applied
              </motion.p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onDecline}
              >
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
              <Button
                className={`flex-1 ${is4MinMode ? 'bg-destructive hover:bg-destructive/90' : 'bg-veno-primary hover:bg-veno-primary/90'}`}
                onClick={onAccept}
              >
                <Check className="w-4 h-4 mr-2" />
                Accept
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
