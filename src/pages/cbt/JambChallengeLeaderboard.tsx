import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, Crown, Medal, Flame, Timer, Gift, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';

interface Season {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  prize_description: string;
  is_active: boolean;
}

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  attempts: number;
  best_percentage: number;
  best_score: number;
  display_name: string | null;
  email: string | null;
}

const JambChallengeLeaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!season) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(season.ends_at).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Challenge ended!');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [season]);

  const fetchData = async () => {
    // Fetch active season
    const { data: seasonData } = await supabase
      .from('jamb_challenge_seasons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (seasonData) {
      setSeason(seasonData as Season);

      // Fetch leaderboard via the view
      const { data: lbData } = await supabase
        .from('jamb_challenge_leaderboard')
        .select('*')
        .eq('season_id', seasonData.id)
        .order('total_points', { ascending: false })
        .limit(50);

      if (lbData) {
        setLeaderboard(lbData as LeaderboardEntry[]);
      }
    }
    setLoading(false);
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getPrizeLabel = (index: number) => {
    if (index === 0) return '₦5,000';
    if (index === 1) return '₦3,000';
    if (index === 2) return '₦2,000';
    return null;
  };

  const getRowBg = (entry: LeaderboardEntry, index: number) => {
    if (user && entry.user_id === user.id) return 'bg-primary/10 border-primary/30';
    if (index === 0) return 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30';
    if (index === 1) return 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/30';
    if (index === 2) return 'bg-gradient-to-r from-amber-600/10 to-orange-600/10 border-amber-600/30';
    return '';
  };

  const myRank = user ? leaderboard.findIndex(e => e.user_id === user.id) : -1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate('/cbt')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <motion.div
            animate={{ rotateY: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            JAMB Challenge
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Complete JAMB practice sessions to earn points. Top 3 win ₦10,000!
          </p>
        </motion.div>

        {/* Prize & Timer Banner */}
        {season && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="mb-6 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-yellow-500/20">
                    <Gift className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{season.title}</h3>
                    <p className="text-sm text-muted-foreground">{season.prize_description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-background/80 rounded-xl p-3 border">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">Time Remaining</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-orange-500">{timeLeft || 'Loading...'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { place: '1st', prize: '₦5,000', color: 'text-yellow-500' },
                    { place: '2nd', prize: '₦3,000', color: 'text-gray-400' },
                    { place: '3rd', prize: '₦2,000', color: 'text-amber-600' },
                  ].map(p => (
                    <div key={p.place} className="text-center p-2 rounded-lg bg-background/60 border">
                      <p className={`font-bold text-lg ${p.color}`}>{p.place}</p>
                      <p className="text-xs font-semibold">{p.prize}</p>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    <Star className="w-3 h-3 inline mr-1" />
                    Points are earned based on your JAMB score percentage. Higher scores = more points!
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Start Practice CTA */}
        <Button
          onClick={() => navigate('/cbt/jamb')}
          className="w-full h-12 mb-6 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          <Flame className="w-5 h-5 mr-2" />
          Start JAMB Practice to Earn Points
        </Button>

        {/* My Position */}
        {user && myRank >= 0 && myRank > 9 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Your Position</p>
            <Card className="p-4 border-2 border-primary/50 bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  #{myRank + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">You</div>
                  <div className="text-sm text-muted-foreground">
                    {leaderboard[myRank]?.attempts} attempts · Best: {leaderboard[myRank]?.best_percentage}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{leaderboard[myRank]?.total_points}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No scores yet. Be the first to earn points!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {leaderboard.map((entry, index) => {
                const username = entry.display_name || entry.email?.split('@')[0] || 'Anonymous';
                const prize = getPrizeLabel(index);

                return (
                  <motion.div
                    key={entry.user_id}
                    layout
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{
                      opacity: 1, x: 0, scale: 1,
                      transition: { type: "spring", stiffness: 500, damping: 30, delay: index * 0.03 }
                    }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  >
                    <Card className={cn("p-4 transition-all duration-300 border-2", getRowBg(entry, index))}>
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className="flex flex-col items-center w-12">
                          {getMedalIcon(index) || (
                            <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">
                              {username}
                              {user && entry.user_id === user.id && (
                                <span className="ml-1 text-xs text-primary">(You)</span>
                              )}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                            <span>{entry.attempts} attempts</span>
                            <span>Best: {entry.best_percentage}%</span>
                          </div>
                        </div>

                        {/* Prize badge */}
                        {prize && (
                          <div className="flex flex-col items-center gap-0.5 px-2">
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Gift className="w-4 h-4" />
                              <span className="text-sm font-semibold">{prize}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">prize</span>
                          </div>
                        )}

                        {/* Points */}
                        <div className="text-right">
                          <motion.div
                            key={entry.total_points}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-2xl font-bold text-primary"
                          >
                            {entry.total_points}
                          </motion.div>
                          <div className="text-xs text-muted-foreground">pts</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* How it works */}
        <Card className="mt-8">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-base">How It Works</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                <p>Start a JAMB Practice session from the CBT page</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                <p>Complete the exam — your score percentage determines your points</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                <p>Points accumulate over 2 weeks. Every practice earns points!</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">4.</span>
                <p>Top 3 at the end of the season share ₦10,000 from VenoBot</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JambChallengeLeaderboard;
