import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Challenge } from '@/hooks/useChallengeSubscription';

interface HostJoinPromptProps {
  challenge: Challenge;
  onJoin: (challenge: Challenge) => void;
  onDismiss: () => void;
}

export const HostJoinPrompt: React.FC<HostJoinPromptProps> = ({
  challenge,
  onJoin,
  onDismiss,
}) => {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      // Update the started_at field to signal to opponent that host is ready
      const { data: updatedChallenge, error } = await supabase
        .from('streak_challenges')
        .update({ started_at: new Date().toISOString() })
        .eq('id', challenge.id)
        .select()
        .single();

      if (error) throw error;
      
      onJoin(updatedChallenge as Challenge);
    } catch (error) {
      console.error('Error joining challenge:', error);
      setIsJoining(false);
    }
  };

  const durationLabel = challenge.duration_seconds === 30 ? '30 seconds' :
    challenge.duration_seconds === 60 ? '1 minute' :
    challenge.duration_seconds === 120 ? '2 minutes' :
    challenge.duration_seconds === 240 ? '4 minutes ⚡' : `${challenge.duration_seconds}s`;

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="veno-card border-green-500/50 shadow-lg shadow-green-500/20">
          <CardContent className="p-8 text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <Users className="w-12 h-12 text-green-500" />
            </motion.div>

            <h2 className="text-2xl font-bold text-green-500 mb-2">
              Challenge Accepted!
            </h2>
            <p className="text-muted-foreground mb-4">
              Your opponent is waiting in the battle room
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="text-sm text-muted-foreground mb-1">Battle Details</div>
              <div className="font-medium">{challenge.subject}</div>
              <div className="text-sm text-muted-foreground">
                {durationLabel} • {(challenge.questions as any[])?.length || 0} questions
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                size="lg"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Join Battle Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={onDismiss}
                className="w-full text-muted-foreground"
                disabled={isJoining}
              >
                Dismiss
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Don't keep your opponent waiting!
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};