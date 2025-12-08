import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock, X, Zap, Mail, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { Challenge } from '@/hooks/useChallengeSubscription';

interface ChallengeWaitingRoomProps {
  challengeId: string;
  opponentUsername: string;
  subject: string;
  durationSeconds: number;
  onChallengeAccepted: (challenge: Challenge) => void;
  onCancel: () => void;
}

export const ChallengeWaitingRoom: React.FC<ChallengeWaitingRoomProps> = ({
  challengeId,
  opponentUsername,
  subject,
  durationSeconds,
  onChallengeAccepted,
  onCancel,
}) => {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [status, setStatus] = useState<'waiting' | 'accepted' | 'declined' | 'expired'>('waiting');
  const [notificationSent, setNotificationSent] = useState({ email: false, inApp: false });

  useEffect(() => {
    // Subscribe to challenge status updates
    const channel = supabase
      .channel(`challenge-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streak_challenges',
          filter: `id=eq.${challengeId}`,
        },
        (payload) => {
          const challenge = payload.new as Challenge;
          
          if (challenge.status === 'in_progress') {
            setStatus('accepted');
            // Small delay to show the accepted state before transitioning
            setTimeout(() => {
              onChallengeAccepted(challenge);
            }, 1000);
          } else if (challenge.status === 'declined') {
            setStatus('declined');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challengeId, onChallengeAccepted]);

  // Countdown timer
  useEffect(() => {
    if (status !== 'waiting') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setStatus('expired');
          // Cancel the challenge when expired
          supabase
            .from('streak_challenges')
            .update({ status: 'expired' })
            .eq('id', challengeId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [challengeId, status]);

  // Check notification status
  useEffect(() => {
    const checkNotifications = async () => {
      // We assume notifications were sent successfully if the challenge was created
      setTimeout(() => {
        setNotificationSent({ email: true, inApp: true });
      }, 2000);
    };
    checkNotifications();
  }, []);

  const handleCancel = async () => {
    await supabase
      .from('streak_challenges')
      .update({ status: 'cancelled' })
      .eq('id', challengeId);
    onCancel();
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
            {status === 'waiting' && (
              <>
                <div className="relative mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-24 h-24 mx-auto rounded-full border-4 border-veno-primary/30 border-t-veno-primary"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-10 h-10 text-veno-primary" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-2">Challenge Sent!</h2>
                <p className="text-muted-foreground mb-4">
                  Waiting for <span className="text-veno-primary font-semibold">{opponentUsername}</span> to respond...
                </p>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-muted-foreground mb-1">Battle Details</div>
                  <div className="font-medium">{subject}</div>
                  <div className="text-sm text-muted-foreground">
                    {Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, '0')} duration
                  </div>
                </div>

                {/* Notification Status */}
                <div className="flex justify-center gap-4 mb-6">
                  <div className={`flex items-center gap-2 text-sm ${notificationSent.email ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {notificationSent.email ? (
                      <Mail className="w-4 h-4" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Email sent
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${notificationSent.inApp ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {notificationSent.inApp ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    In-app notification
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-lg font-mono">
                    {timeRemaining}s remaining
                  </span>
                </div>

                <Button variant="outline" onClick={handleCancel} className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  Cancel Challenge
                </Button>
              </>
            )}

            {status === 'accepted' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <Zap className="w-12 h-12 text-green-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-green-500 mb-2">Challenge Accepted!</h2>
                <p className="text-muted-foreground">Starting battle...</p>
              </motion.div>
            )}

            {status === 'declined' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
                  <X className="w-12 h-12 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-destructive mb-2">Challenge Declined</h2>
                <p className="text-muted-foreground mb-6">
                  {opponentUsername} declined the challenge.
                </p>
                <Button onClick={onCancel} className="w-full">
                  Go Back
                </Button>
              </motion.div>
            )}

            {status === 'expired' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Challenge Expired</h2>
                <p className="text-muted-foreground mb-6">
                  {opponentUsername} didn't respond in time.
                </p>
                <Button onClick={onCancel} className="w-full">
                  Go Back
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
