import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Clock, Trash2, Loader2, Users, Zap, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Challenge } from '@/hooks/useChallengeSubscription';

interface PendingChallengesProps {
  onChallengeAccepted: (challenge: Challenge) => void;
}

export const PendingChallenges: React.FC<PendingChallengesProps> = ({ onChallengeAccepted }) => {
  const { user } = useAuth();
  const [pendingChallenges, setPendingChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch pending link-based challenges created by this user
  const fetchPendingChallenges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('streak_challenges')
        .select('*')
        .eq('host_id', user.id)
        .eq('status', 'pending')
        .not('share_code', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out expired challenges
      const validChallenges = (data || []).filter(c => 
        !c.expires_at || new Date(c.expires_at) > new Date()
      );

      setPendingChallenges(validChallenges);
    } catch (error) {
      console.error('Error fetching pending challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingChallenges();
  }, [user]);

  // Subscribe to real-time updates for when challenges are accepted
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('pending-challenges-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streak_challenges',
          filter: `host_id=eq.${user.id}`,
        },
        (payload) => {
          const challenge = payload.new as Challenge;
          
          // Check if a pending link challenge was just accepted
          if (challenge.status === 'in_progress' && challenge.share_code) {
            // Remove from pending list
            setPendingChallenges(prev => prev.filter(c => c.id !== challenge.id));
            
            // Notify the host and allow them to join
            toast({
              title: 'Challenge Accepted!',
              description: 'Your challenge has been accepted. Joining battle...',
            });
            
            // Trigger the battle arena for the host
            onChallengeAccepted(challenge);
          }
          
          // Remove cancelled/expired challenges
          if (challenge.status === 'cancelled' || challenge.status === 'expired') {
            setPendingChallenges(prev => prev.filter(c => c.id !== challenge.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'streak_challenges',
          filter: `host_id=eq.${user.id}`,
        },
        (payload) => {
          const challenge = payload.new as any;
          // Add new link challenges to the list
          if (challenge.share_code && challenge.status === 'pending') {
            setPendingChallenges(prev => [challenge, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onChallengeAccepted]);

  const handleDeleteChallenge = async (challengeId: string) => {
    setDeletingId(challengeId);
    try {
      const { error } = await supabase
        .from('streak_challenges')
        .update({ status: 'cancelled' })
        .eq('id', challengeId)
        .eq('host_id', user?.id);

      if (error) throw error;

      setPendingChallenges(prev => prev.filter(c => c.id !== challengeId));
      toast({
        title: 'Challenge cancelled',
        description: 'The challenge link has been cancelled.',
      });
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel challenge.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = async (shareCode: string) => {
    const link = `${window.location.origin}/cbt/challenge/${shareCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Copied!',
        description: 'Challenge link copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="veno-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            My Pending Challenges
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (pendingChallenges.length === 0) {
    return null; // Don't show anything if no pending challenges
  }

  return (
    <Card className="veno-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5 text-veno-primary" />
          My Pending Challenges
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {pendingChallenges.length} active
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence mode="popLayout">
          {pendingChallenges.map((challenge) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-veno-primary flex-shrink-0" />
                    <span className="font-medium truncate">{challenge.subject}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {challenge.duration_seconds}s
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {(challenge.questions as any[])?.length || 0} Q
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Waiting...
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Created {formatDistanceToNow(new Date(challenge.created_at), { addSuffix: true })}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyLink(challenge.share_code)}
                    className="h-8 px-2"
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteChallenge(challenge.id)}
                    disabled={deletingId === challenge.id}
                    className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deletingId === challenge.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <p className="text-xs text-center text-muted-foreground pt-2">
          You'll be automatically notified when someone accepts your challenge
        </p>
      </CardContent>
    </Card>
  );
};
