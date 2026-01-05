import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from '@/hooks/use-toast';

export interface Challenge {
  id: string;
  host_id: string;
  opponent_id: string | null;
  subject: string;
  duration_seconds: number;
  difficulty: string;
  status: string;
  questions: any[];
  host_score: number;
  opponent_score: number;
  winner_id: string | null;
  is_draw: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  share_code: string | null;
  host_finished: boolean | null;
  opponent_finished: boolean | null;
}

export interface IncomingChallenge {
  challenge: Challenge;
  hostUsername: string;
}

export const useChallengeSubscription = () => {
  const [incomingChallenge, setIncomingChallenge] = useState<IncomingChallenge | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to challenges where user is the opponent
    const channel = supabase
      .channel('challenge-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'streak_challenges',
          filter: `opponent_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Incoming challenge:', payload);
          const challenge = payload.new as Challenge;
          
          // Get host username
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, display_name')
            .eq('id', challenge.host_id)
            .single();

          const hostUsername = profile?.display_name || profile?.email?.split('@')[0] || 'Unknown';
          
          setIncomingChallenge({
            challenge,
            hostUsername,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streak_challenges',
        },
        async (payload) => {
          const challenge = payload.new as Challenge;
          
          // Update active challenge if it's the same one - re-fetch to ensure complete data
          if (activeChallenge && activeChallenge.id === challenge.id) {
            const { data: fullChallenge } = await supabase
              .from('streak_challenges')
              .select('*')
              .eq('id', challenge.id)
              .single();
            
            if (fullChallenge) {
              setActiveChallenge(fullChallenge as Challenge);
            }
          }
          
          // Clear incoming challenge if it was accepted/declined
          if (incomingChallenge && incomingChallenge.challenge.id === challenge.id) {
            if (challenge.status !== 'pending') {
              setIncomingChallenge(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChallenge, incomingChallenge]);

  const acceptChallenge = useCallback(async (challengeId: string) => {
    try {
      const { data, error } = await supabase
        .from('streak_challenges')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', challengeId)
        .select()
        .single();

      if (error) throw error;

      setActiveChallenge(data as Challenge);
      setIncomingChallenge(null);
      
      return data as Challenge;
    } catch (error) {
      console.error('Error accepting challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept challenge',
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  const declineChallenge = useCallback(async (challengeId: string) => {
    try {
      await supabase
        .from('streak_challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId);

      setIncomingChallenge(null);
    } catch (error) {
      console.error('Error declining challenge:', error);
    }
  }, []);

  const clearIncomingChallenge = useCallback(() => {
    setIncomingChallenge(null);
  }, []);

  return {
    incomingChallenge,
    activeChallenge,
    setActiveChallenge,
    acceptChallenge,
    declineChallenge,
    clearIncomingChallenge,
  };
};
