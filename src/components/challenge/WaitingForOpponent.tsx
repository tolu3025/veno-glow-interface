import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface WaitingForOpponentProps {
  challengeId: string;
  yourScore: number;
  totalQuestions: number;
  onBothFinished: (result: {
    hostScore: number;
    opponentScore: number;
    winnerId: string | null;
    isDraw: boolean;
  }) => void;
}

export const WaitingForOpponent: React.FC<WaitingForOpponentProps> = ({
  challengeId,
  yourScore,
  totalQuestions,
  onBothFinished,
}) => {
  const [waitingTime, setWaitingTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaitingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Subscribe to challenge completion
  useEffect(() => {
    const channel = supabase
      .channel(`challenge-result-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streak_challenges',
          filter: `id=eq.${challengeId}`,
        },
        (payload) => {
          const challenge = payload.new as any;
          if (challenge.status === 'completed') {
            onBothFinished({
              hostScore: challenge.host_score,
              opponentScore: challenge.opponent_score,
              winnerId: challenge.winner_id,
              isDraw: challenge.is_draw,
            });
          }
        }
      )
      .subscribe();

    // Also check immediately in case it's already completed
    const checkStatus = async () => {
      const { data: challenge } = await supabase
        .from('streak_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challenge?.status === 'completed') {
        onBothFinished({
          hostScore: challenge.host_score,
          opponentScore: challenge.opponent_score,
          winnerId: challenge.winner_id,
          isDraw: challenge.is_draw,
        });
      }
    };
    checkStatus();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challengeId, onBothFinished]);

  return (
    <div className="max-w-md mx-auto p-4 flex items-center justify-center min-h-screen">
      <Card className="p-8 text-center w-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="inline-block mb-6"
        >
          <Loader2 className="w-16 h-16 text-veno-primary" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">Waiting for Opponent</h2>
        <p className="text-muted-foreground mb-6">
          Your opponent is still answering questions...
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Your Score</div>
            <div className="text-2xl font-bold text-veno-primary">
              {yourScore}/{totalQuestions}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" /> Waiting
            </div>
            <div className="text-2xl font-bold">
              {waitingTime}s
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          Results will appear when both players finish
        </div>
      </Card>
    </div>
  );
};
