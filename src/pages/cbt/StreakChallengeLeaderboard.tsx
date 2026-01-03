import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Medal, ArrowLeft, TrendingUp, TrendingDown, Minus, Crown, Swords, Target, ChevronUp, ChevronDown, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';
import LeaderboardUserModal from '@/components/challenge/LeaderboardUserModal';
import { COIN_REWARDS } from '@/services/coinService';

interface LeaderboardEntry {
  user_id: string;
  current_streak: number;
  highest_streak: number;
  total_wins: number;
  total_challenges: number;
  username: string;
  rank: number;
  previousRank?: number;
  rankChange?: 'up' | 'down' | 'same' | 'new';
}

const StreakChallengeLeaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [previousLeaderboard, setPreviousLeaderboard] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [currentUserStats, setCurrentUserStats] = useState<LeaderboardEntry | null>(null);

  const fetchLeaderboard = async (isInitial = false) => {
    const { data } = await supabase
      .from('user_challenge_stats')
      .select('*')
      .order('highest_streak', { ascending: false })
      .order('total_wins', { ascending: false })
      .limit(50);

    if (data) {
      const enriched = await Promise.all(data.map(async (entry, index) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, display_name')
          .eq('id', entry.user_id)
          .single();
        
        const rank = index + 1;
        const previousRank = previousLeaderboard.get(entry.user_id);
        let rankChange: 'up' | 'down' | 'same' | 'new' = 'same';
        
        if (!isInitial && previousRank !== undefined) {
          if (previousRank > rank) rankChange = 'up';
          else if (previousRank < rank) rankChange = 'down';
        } else if (!isInitial) {
          rankChange = 'new';
        }

        return { 
          ...entry, 
          username: profile?.display_name || profile?.email?.split('@')[0] || 'Anonymous',
          rank,
          previousRank,
          rankChange
        };
      }));

      // Store current positions for next comparison
      const newPositions = new Map<string, number>();
      enriched.forEach(entry => newPositions.set(entry.user_id, entry.rank));
      setPreviousLeaderboard(newPositions);

      setLeaderboard(enriched);
      
      // Find current user stats
      if (user) {
        const myStats = enriched.find(e => e.user_id === user.id);
        setCurrentUserStats(myStats || null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard(true);

    // Real-time subscription
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_challenge_stats'
        },
        () => {
          fetchLeaderboard(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  // Get coin reward for position
  const getCoinReward = (index: number) => {
    if (index === 0) return COIN_REWARDS.leaderboard_1st;
    if (index === 1) return COIN_REWARDS.leaderboard_2nd;
    if (index >= 2 && index <= 9) return COIN_REWARDS.leaderboard_3rd_to_10th;
    return 0;
  };

  const getRankChangeIcon = (change: 'up' | 'down' | 'same' | 'new' | undefined) => {
    if (change === 'up') return <ChevronUp className="w-4 h-4 text-green-500" />;
    if (change === 'down') return <ChevronDown className="w-4 h-4 text-red-500" />;
    if (change === 'new') return <span className="text-xs text-blue-500 font-bold">NEW</span>;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getRowBackground = (entry: LeaderboardEntry, index: number) => {
    if (user && entry.user_id === user.id) {
      return 'bg-veno-primary/10 border-veno-primary/30';
    }
    if (index === 0) return 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30';
    if (index === 1) return 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/30';
    if (index === 2) return 'bg-gradient-to-r from-amber-600/10 to-orange-600/10 border-amber-600/30';
    return '';
  };

  // Find users who could overtake others
  const getThreateningUsers = (entry: LeaderboardEntry, index: number) => {
    if (index === 0) return null;
    const aboveUser = leaderboard[index - 1];
    const streakDiff = aboveUser.highest_streak - entry.highest_streak;
    const winsDiff = aboveUser.total_wins - entry.total_wins;
    
    if (streakDiff <= 2 || winsDiff <= 3) {
      return aboveUser;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate('/cbt/streak-challenge')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* Header with animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-8"
        >
          <motion.div
            animate={{ 
              rotateY: [0, 10, -10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Streak Leaderboard
          </h1>
          <p className="text-muted-foreground mt-2">Tap any player to view stats & win probability</p>
        </motion.div>

        {/* My Position (if not in top 50) */}
        {user && currentUserStats && currentUserStats.rank > 10 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4"
          >
            <p className="text-sm text-muted-foreground mb-2">Your Position</p>
            <Card 
              className={cn(
                "p-4 border-2 border-veno-primary/50 bg-veno-primary/5 cursor-pointer hover:bg-veno-primary/10 transition-colors"
              )}
              onClick={() => setSelectedUser(currentUserStats)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-veno-primary/20 flex items-center justify-center font-bold text-veno-primary">
                  #{currentUserStats.rank}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{currentUserStats.username} (You)</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" /> {currentUserStats.highest_streak}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-yellow-500" /> {currentUserStats.total_wins}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-veno-primary">{currentUserStats.current_streak}</div>
                  <div className="text-xs text-muted-foreground">streak</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No challenges completed yet. Be the first!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {leaderboard.map((entry, index) => {
                const threateningUser = getThreateningUsers(entry, index);
                
                return (
                  <motion.div
                    key={entry.user_id}
                    layout
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      scale: 1,
                      transition: { 
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        delay: index * 0.03
                      }
                    }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={cn(
                        "p-4 cursor-pointer transition-all duration-300 border-2",
                        getRowBackground(entry, index),
                        "hover:shadow-lg"
                      )}
                      onClick={() => setSelectedUser(entry)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className="flex flex-col items-center w-12">
                          {getMedalIcon(index) || (
                            <span className="text-lg font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                          <div className="flex items-center mt-0.5">
                            {getRankChangeIcon(entry.rankChange)}
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">
                              {entry.username}
                              {user && entry.user_id === user.id && (
                                <span className="ml-1 text-xs text-veno-primary">(You)</span>
                              )}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-orange-500" /> 
                              {entry.highest_streak} best
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-yellow-500" /> 
                              {entry.total_wins}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-green-500" /> 
                              {entry.total_challenges > 0 
                                ? Math.round((entry.total_wins / entry.total_challenges) * 100) 
                                : 0}%
                            </span>
                          </div>
                          
                            {/* Threatening indicator */}
                            {threateningUser && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-1 text-xs text-amber-500 flex items-center gap-1"
                              >
                                <TrendingUp className="w-3 h-3" />
                                Close to overtaking #{index}!
                              </motion.div>
                            )}
                          </div>

                          {/* Coin Reward Badge (Top 10) */}
                          {getCoinReward(index) > 0 && (
                            <div className="flex flex-col items-center gap-1 px-2">
                              <div className="flex items-center gap-1 text-amber-500">
                                <Coins className="w-4 h-4" />
                                <span className="text-sm font-semibold">+{getCoinReward(index)}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">weekly</span>
                            </div>
                          )}

                          {/* Current Streak */}
                          <div className="text-right">
                            <motion.div
                              key={entry.current_streak}
                              initial={{ scale: 1.2 }}
                              animate={{ scale: 1 }}
                              className="text-2xl font-bold text-veno-primary"
                            >
                              {entry.current_streak}
                            </motion.div>
                            <div className="text-xs text-muted-foreground">streak</div>
                          </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* User Modal */}
        <LeaderboardUserModal
          user={selectedUser}
          currentUser={currentUserStats}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onChallenge={(userId) => {
            setSelectedUser(null);
            navigate('/cbt/streak-challenge');
          }}
        />
      </div>
    </div>
  );
};

export default StreakChallengeLeaderboard;
