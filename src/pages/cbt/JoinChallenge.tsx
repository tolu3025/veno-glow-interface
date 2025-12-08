import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Clock, BookOpen, Zap, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BattleArena } from '@/components/challenge/BattleArena';
import { WaitingForOpponent } from '@/components/challenge/WaitingForOpponent';
import { ChallengeResults } from '@/components/challenge/ChallengeResults';

const JoinChallenge = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [challenge, setChallenge] = useState<any>(null);
  const [hostProfile, setHostProfile] = useState<{ display_name?: string; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [waitingState, setWaitingState] = useState<{ challengeId: string; yourScore: number; totalQuestions: number; isHost: boolean } | null>(null);
  const [battleResult, setBattleResult] = useState<any>(null);

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!shareCode) {
        setError('Invalid challenge link');
        setIsLoading(false);
        return;
      }

      try {
        const { data: challengeData, error: challengeError } = await supabase
          .from('streak_challenges')
          .select('*')
          .eq('share_code', shareCode)
          .single();

        if (challengeError || !challengeData) {
          setError('Challenge not found');
          setIsLoading(false);
          return;
        }

        // Check if challenge has expired
        if (challengeData.expires_at && new Date(challengeData.expires_at) < new Date()) {
          setError('This challenge has expired');
          setIsLoading(false);
          return;
        }

        // Check if challenge is already taken
        if (challengeData.opponent_id && challengeData.status !== 'pending') {
          setError('This challenge has already been accepted by someone else');
          setIsLoading(false);
          return;
        }

        // Check if user is the host (can't challenge yourself)
        if (user && challengeData.host_id === user.id) {
          setError('You cannot join your own challenge');
          setIsLoading(false);
          return;
        }

        // Check if this user already joined
        if (user && challengeData.opponent_id === user.id) {
          // User already joined, check status
          if (challengeData.status === 'in_progress') {
            setActiveChallenge(challengeData);
          }
          setChallenge(challengeData);
          setIsLoading(false);
          return;
        }

        setChallenge(challengeData);

        // Fetch host profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('id', challengeData.host_id)
          .single();

        setHostProfile(profile);
      } catch (err) {
        console.error('Error fetching challenge:', err);
        setError('Failed to load challenge');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenge();
  }, [shareCode, user]);

  const handleJoinChallenge = async () => {
    if (!user || !challenge) return;

    setIsJoining(true);
    try {
      // Update challenge with opponent_id and start the battle
      const { data: updatedChallenge, error: updateError } = await supabase
        .from('streak_challenges')
        .update({
          opponent_id: user.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', challenge.id)
        .eq('status', 'pending')
        .select()
        .single();

      if (updateError) {
        if (updateError.code === 'PGRST116') {
          setError('This challenge has already been accepted by someone else');
        } else {
          throw updateError;
        }
        return;
      }

      // Get current user's display name for notification
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', user.id)
        .single();

      const opponentName = userProfile?.display_name || userProfile?.email?.split('@')[0] || 'Someone';

      // Notify the host that their challenge was accepted
      try {
        await supabase.functions.invoke('send-challenge-notification', {
          body: {
            type: 'challenge_accepted',
            challengeId: challenge.id,
            hostId: challenge.host_id,
            opponentUsername: opponentName,
            subject: challenge.subject,
            shareCode: shareCode,
          },
        });
      } catch (notifError) {
        console.error('Failed to send acceptance notification:', notifError);
        // Don't block the challenge if notification fails
      }

      toast({
        title: 'Challenge accepted!',
        description: 'The battle is starting...',
      });

      setActiveChallenge(updatedChallenge);
    } catch (err) {
      console.error('Error joining challenge:', err);
      toast({
        title: 'Error',
        description: 'Failed to join challenge. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleBattleComplete = async (score: number) => {
    if (!activeChallenge || !user) return;
    
    const isHost = activeChallenge.host_id === user.id;
    const totalQuestions = (activeChallenge.questions as any[])?.length || 0;
    
    const updateData = isHost 
      ? { host_score: score, host_finished: true }
      : { opponent_score: score, opponent_finished: true };
    
    await supabase
      .from('streak_challenges')
      .update(updateData)
      .eq('id', activeChallenge.id);

    setWaitingState({
      challengeId: activeChallenge.id,
      yourScore: score,
      totalQuestions,
      isHost,
    });
    setActiveChallenge(null);
  };

  const handleBothFinished = async (result: {
    hostScore: number;
    opponentScore: number;
    winnerId: string | null;
    isDraw: boolean;
  }) => {
    if (!user || !waitingState) return;

    const { data: stats } = await supabase
      .from('user_challenge_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setBattleResult({
      isWinner: result.winnerId === user.id,
      isDraw: result.isDraw,
      yourScore: waitingState.yourScore,
      opponentScore: waitingState.isHost ? result.opponentScore : result.hostScore,
      totalQuestions: waitingState.totalQuestions,
      newStreak: stats?.current_streak || 0,
      streakChange: result.winnerId === user.id ? 1 : 0,
    });
    setWaitingState(null);
  };

  // Render battle arena if challenge is active
  if (activeChallenge) {
    const isHost = activeChallenge.host_id === user?.id;
    return (
      <BattleArena
        challengeId={activeChallenge.id}
        questions={activeChallenge.questions as any[]}
        durationSeconds={activeChallenge.duration_seconds}
        isHost={isHost}
        opponentName={hostProfile?.display_name || hostProfile?.email?.split('@')[0] || 'Challenger'}
        onComplete={handleBattleComplete}
      />
    );
  }

  // Render waiting state
  if (waitingState) {
    return (
      <WaitingForOpponent
        challengeId={waitingState.challengeId}
        yourScore={waitingState.yourScore}
        totalQuestions={waitingState.totalQuestions}
        onBothFinished={handleBothFinished}
      />
    );
  }

  // Render results
  if (battleResult) {
    return (
      <ChallengeResults
        {...battleResult}
        opponentName={hostProfile?.display_name || hostProfile?.email?.split('@')[0] || 'Challenger'}
        onRematch={() => setBattleResult(null)}
        onGoHome={() => navigate('/cbt/streak-challenge')}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-veno-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Challenge Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/cbt/streak-challenge')} className="bg-veno-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Streak Challenge
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Flame className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-bold mb-2">Sign in to Accept Challenge</h2>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to accept this challenge from{' '}
              <span className="font-semibold text-foreground">
                {hostProfile?.display_name || hostProfile?.email?.split('@')[0] || 'a challenger'}
              </span>
            </p>
            <div className="p-3 rounded-lg bg-muted/50 border mb-4">
              <p className="text-sm font-medium">{challenge?.subject}</p>
              <p className="text-xs text-muted-foreground">
                {challenge?.duration_seconds} seconds • {(challenge?.questions as any[])?.length || 0} questions
              </p>
            </div>
            <Button onClick={() => navigate('/auth')} className="w-full bg-veno-primary">
              Sign In to Accept
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hostName = hostProfile?.display_name || hostProfile?.email?.split('@')[0] || 'Someone';
  const durationLabel = challenge?.duration_seconds === 30 ? '30 seconds' :
    challenge?.duration_seconds === 60 ? '1 minute' :
    challenge?.duration_seconds === 120 ? '2 minutes' :
    challenge?.duration_seconds === 240 ? '4 minutes ⚡' : `${challenge?.duration_seconds}s`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/cbt/streak-challenge')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Challenge Received!</h1>
          <p className="text-muted-foreground mt-2">
            <span className="font-semibold text-foreground">{hostName}</span> challenges you!
          </p>
        </motion.div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Challenge Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-veno-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-veno-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium">{challenge?.subject}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{durationLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="font-medium">{(challenge?.questions as any[])?.length || 0} questions</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Difficulty</p>
                <p className="font-medium capitalize">{challenge?.difficulty}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={handleJoinChallenge}
            disabled={isJoining}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            size="lg"
          >
            {isJoining ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Zap className="w-5 h-5 mr-2" />
            )}
            Accept Challenge
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/cbt/streak-challenge')}
            className="w-full"
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JoinChallenge;
