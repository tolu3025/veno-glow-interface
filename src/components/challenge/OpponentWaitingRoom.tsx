import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock, Zap, Users, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Challenge } from '@/hooks/useChallengeSubscription';

const TIMEOUT_SECONDS = 120; // 2 minutes

interface OpponentWaitingRoomProps {
  challenge: Challenge;
  hostName: string;
  onBothReady: (challenge: Challenge) => void;
  onTimeout?: () => void;
}

export const OpponentWaitingRoom: React.FC<OpponentWaitingRoomProps> = ({
  challenge,
  hostName,
  onBothReady,
  onTimeout,
}) => {
  const [hostJoined, setHostJoined] = useState(false);
  const [dots, setDots] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
  const [timedOut, setTimedOut] = useState(false);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (hostJoined || timedOut) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hostJoined, timedOut]);

  // Listen for host to join (detected when started_at is set)
  useEffect(() => {
    // First check if host already joined
    const checkIfHostReady = async () => {
      const { data } = await supabase
        .from('streak_challenges')
        .select('*')
        .eq('id', challenge.id)
        .single();
      
      if (data && data.started_at) {
        setHostJoined(true);
        // Merge with original challenge to ensure all fields are present
        const mergedChallenge = {
          ...challenge,
          ...data,
        } as Challenge;
        setTimeout(() => {
          onBothReady(mergedChallenge);
        }, 2000);
        return true;
      }
      return false;
    };

    // Check immediately
    checkIfHostReady();

    // Subscribe to updates
    const channel = supabase
      .channel(`opponent-waiting-${challenge.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streak_challenges',
          filter: `id=eq.${challenge.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          // Check if host has joined (started_at is set)
          if (updated.started_at && !hostJoined) {
            setHostJoined(true);
            // Merge with original challenge to ensure all fields (especially questions) are present
            const mergedChallenge = {
              ...challenge,
              ...updated,
            } as Challenge;
            setTimeout(() => {
              onBothReady(mergedChallenge);
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challenge.id, onBothReady, hostJoined]);

  const durationLabel = challenge.duration_seconds === 30 ? '30 seconds' :
    challenge.duration_seconds === 60 ? '1 minute' :
    challenge.duration_seconds === 120 ? '2 minutes' :
    challenge.duration_seconds === 240 ? '4 minutes ⚡' : `${challenge.duration_seconds}s`;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="veno-card border-veno-primary/30">
          <CardContent className="p-8 text-center">
            {timedOut ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center"
                >
                  <XCircle className="w-12 h-12 text-destructive" />
                </motion.div>
                <h2 className="text-2xl font-bold text-destructive mb-2">Host Didn't Join</h2>
                <p className="text-muted-foreground mb-4">
                  The host didn't join within 2 minutes
                </p>
                
                <Button
                  onClick={onTimeout}
                  variant="outline"
                  className="w-full"
                >
                  Leave Challenge
                </Button>
              </motion.div>
            ) : hostJoined ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-green-500 mb-2">Host Joined!</h2>
                <p className="text-muted-foreground mb-4">Starting battle...</p>
                
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-veno-primary" />
                  <span className="text-veno-primary font-medium">Get ready!</span>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="relative mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-24 h-24 mx-auto rounded-full border-4 border-veno-primary/30 border-t-veno-primary"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="w-10 h-10 text-veno-primary" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-2">Challenge Accepted!</h2>
                <p className="text-muted-foreground mb-4">
                  Waiting for <span className="text-veno-primary font-semibold">{hostName}</span> to join{dots}
                </p>

                {/* Timeout countdown */}
                <div className="mb-4 p-2 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className={`font-mono font-medium ${timeLeft <= 30 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      {formatTime(timeLeft)} remaining
                    </span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-muted-foreground mb-1">Battle Details</div>
                  <div className="font-medium">{challenge.subject}</div>
                  <div className="text-sm text-muted-foreground">
                    {durationLabel} • {(challenge.questions as any[])?.length || 0} questions
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Host is being notified...</span>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  The battle will start automatically when {hostName} joins
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};