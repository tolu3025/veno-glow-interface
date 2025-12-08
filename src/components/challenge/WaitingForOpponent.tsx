import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock, Users, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

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
  const { user } = useAuth();
  const [waitingTime, setWaitingTime] = useState(0);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaitingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check and process results when both players are done
  const processResults = async (challenge: any) => {
    if (processedRef.current) return;
    
    const hostFinished = challenge.host_finished === true;
    const opponentFinished = challenge.opponent_finished === true;

    if (!hostFinished || !opponentFinished) {
      // Update UI to show opponent progress
      const isHost = challenge.host_id === user?.id;
      if (isHost && opponentFinished) setOpponentFinished(true);
      if (!isHost && hostFinished) setOpponentFinished(true);
      return;
    }

    // Both finished - process result if not already completed
    if (challenge.status !== 'completed') {
      processedRef.current = true;
      
      const { data: result } = await supabase.functions.invoke('process-challenge-result', {
        body: {
          challengeId: challenge.id,
          hostScore: challenge.host_score,
          opponentScore: challenge.opponent_score,
        },
      });

      // Fetch final result
      const { data: finalResult } = await supabase
        .from('streak_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (finalResult) {
        onBothFinished({
          hostScore: finalResult.host_score,
          opponentScore: finalResult.opponent_score,
          winnerId: finalResult.winner_id,
          isDraw: finalResult.is_draw,
        });
      }
    } else {
      // Already completed
      processedRef.current = true;
      onBothFinished({
        hostScore: challenge.host_score,
        opponentScore: challenge.opponent_score,
        winnerId: challenge.winner_id,
        isDraw: challenge.is_draw,
      });
    }
  };

  // Subscribe to challenge updates
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
          processResults(payload.new);
        }
      )
      .subscribe();

    // Check current status immediately
    const checkStatus = async () => {
      const { data: challenge } = await supabase
        .from('streak_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challenge) {
        processResults(challenge);
      }
    };
    checkStatus();

    // Poll every 2 seconds as backup
    const pollInterval = setInterval(checkStatus, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [challengeId, user?.id]);

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

        <h2 className="text-2xl font-bold mb-2">
          {opponentFinished ? 'Processing Results...' : 'Waiting for Opponent'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {opponentFinished 
            ? 'Both players finished! Calculating results...'
            : 'Your opponent is still answering questions...'
          }
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" /> Your Score
            </div>
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

        {opponentFinished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-green-500/10 text-green-500 text-sm mb-4"
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Opponent has finished!
          </motion.div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          Results will appear when both players finish
        </div>
      </Card>
    </div>
  );
};
