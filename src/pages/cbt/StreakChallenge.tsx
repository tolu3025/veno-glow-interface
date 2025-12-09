import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Zap, ArrowLeft, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useChallengeSubscription, Challenge } from '@/hooks/useChallengeSubscription';
import { OnlineUsersList } from '@/components/challenge/OnlineUsersList';
import { ChallengeSetupModal } from '@/components/challenge/ChallengeSetupModal';
import { CreateChallengeLinkModal } from '@/components/challenge/CreateChallengeLinkModal';
import { IncomingChallengePopup } from '@/components/challenge/IncomingChallengePopup';
import { BattleArena } from '@/components/challenge/BattleArena';
import { ChallengeResults } from '@/components/challenge/ChallengeResults';
import { WaitingForOpponent } from '@/components/challenge/WaitingForOpponent';
import { PendingChallenges } from '@/components/challenge/PendingChallenges';
import { supabase } from '@/integrations/supabase/client';

const StreakChallenge = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onlineUsers, isConnected } = useOnlineUsers();
  const { incomingChallenge, activeChallenge, setActiveChallenge, acceptChallenge, declineChallenge } = useChallengeSubscription();
  
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<{ id: string; username: string } | null>(null);
  const [userStats, setUserStats] = useState({ currentStreak: 0, highestStreak: 0, totalWins: 0 });
  const [battleResult, setBattleResult] = useState<any>(null);
  const [waitingState, setWaitingState] = useState<{ challengeId: string; yourScore: number; totalQuestions: number; isHost: boolean } | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from('user_challenge_stats').select('*').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data) setUserStats({ currentStreak: data.current_streak, highestStreak: data.highest_streak, totalWins: data.total_wins });
        });
    }
  }, [user]);

  const handleChallengeUser = (userId: string, username: string) => {
    setSelectedOpponent({ id: userId, username });
    setShowSetupModal(true);
  };

  const handleAcceptChallenge = async () => {
    if (!incomingChallenge) return;
    const challenge = await acceptChallenge(incomingChallenge.challenge.id);
    if (challenge) setActiveChallenge(challenge);
  };

  // Handle when a link-based challenge is accepted by someone
  const handleLinkChallengeAccepted = useCallback((challenge: Challenge) => {
    setActiveChallenge(challenge);
  }, []);

  const handleBattleComplete = async (score: number) => {
    if (!activeChallenge || !user) return;
    const isHost = activeChallenge.host_id === user.id;
    const totalQuestions = (activeChallenge.questions as any[])?.length || 0;
    
    // Update the challenge with this player's score and mark them as finished
    const updateData = isHost 
      ? { host_score: score, host_finished: true }
      : { opponent_score: score, opponent_finished: true };
    
    await supabase
      .from('streak_challenges')
      .update(updateData)
      .eq('id', activeChallenge.id);

    // Always go to waiting state - let WaitingForOpponent handle sync
    setWaitingState({
      challengeId: activeChallenge.id,
      yourScore: score,
      totalQuestions,
      isHost,
    });
    setActiveChallenge(null);
  };

  const handleBothFinished = useCallback(async (result: {
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
  }, [user, waitingState]);

  // Show waiting for opponent screen
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <Flame className="w-16 h-16 mx-auto mb-4 text-veno-primary" />
          <h2 className="text-xl font-bold mb-2">Sign in to Challenge</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in to participate in streak challenges.</p>
          <Button onClick={() => navigate('/auth')} className="bg-veno-primary">Sign In</Button>
        </Card>
      </div>
    );
  }

  if (activeChallenge) {
    const isHost = activeChallenge.host_id === user.id;
    return (
      <BattleArena
        challengeId={activeChallenge.id}
        questions={activeChallenge.questions as any[]}
        durationSeconds={activeChallenge.duration_seconds}
        isHost={isHost}
        opponentName={isHost ? 'Opponent' : 'Host'}
        onComplete={handleBattleComplete}
      />
    );
  }

  if (battleResult) {
    return (
      <ChallengeResults
        {...battleResult}
        opponentName="Opponent"
        onRematch={() => setBattleResult(null)}
        onGoHome={() => { setBattleResult(null); navigate('/cbt/streak-challenge'); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {incomingChallenge && (
        <IncomingChallengePopup
          challenge={incomingChallenge}
          onAccept={handleAcceptChallenge}
          onDecline={() => declineChallenge(incomingChallenge.challenge.id)}
        />
      )}
      
      {showSetupModal && selectedOpponent && (
        <ChallengeSetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          opponentId={selectedOpponent.id}
          opponentUsername={selectedOpponent.username}
          onChallengeCreated={(id) => console.log('Challenge created:', id)}
          onChallengeAccepted={(challenge) => {
            setActiveChallenge(challenge);
            setShowSetupModal(false);
          }}
        />
      )}

      <CreateChallengeLinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
      />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/cbt')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to CBT
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Flame className="w-8 h-8 text-orange-500" /> Streak Challenge
          </h1>
          <p className="text-muted-foreground mt-2">Challenge other players in real-time battles!</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="veno-card p-4 text-center">
            <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{userStats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
          </Card>
          <Card className="veno-card p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{userStats.highestStreak}</div>
            <div className="text-sm text-muted-foreground">Best Streak</div>
          </Card>
          <Card className="veno-card p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-veno-primary" />
            <div className="text-2xl font-bold">{userStats.totalWins}</div>
            <div className="text-sm text-muted-foreground">Total Wins</div>
          </Card>
        </div>

        {/* Pending Challenges Section */}
        <div className="mb-6">
          <PendingChallenges onChallengeAccepted={handleLinkChallengeAccepted} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <OnlineUsersList users={onlineUsers} isConnected={isConnected} onChallengeUser={handleChallengeUser} />
          <Card className="veno-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5" /> Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-veno-primary hover:bg-veno-primary/90" onClick={() => setShowLinkModal(true)}>
                <Link className="w-4 h-4 mr-2" /> Create Challenge Link
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate('/cbt/streak-leaderboard')}>
                <Trophy className="w-4 h-4 mr-2" /> View Leaderboard
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate('/streak-analytics')}>
                <Flame className="w-4 h-4 mr-2" /> Streak Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StreakChallenge;
