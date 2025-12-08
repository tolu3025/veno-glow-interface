import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Medal, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  current_streak: number;
  highest_streak: number;
  total_wins: number;
  username?: string;
}

const StreakChallengeLeaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from('user_challenge_stats')
        .select('*')
        .order('highest_streak', { ascending: false })
        .order('total_wins', { ascending: false })
        .limit(50);

      if (data) {
        const enriched = await Promise.all(data.map(async (entry) => {
          const { data: profile } = await supabase.from('profiles').select('email, display_name').eq('id', entry.user_id).single();
          return { ...entry, username: profile?.display_name || profile?.email?.split('@')[0] || 'Anonymous' };
        }));
        setLeaderboard(enriched);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/cbt/streak-challenge')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" /> Streak Leaderboard
          </h1>
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : leaderboard.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No challenges completed yet. Be the first!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`p-4 flex items-center gap-4 ${index < 3 ? 'border-yellow-500/30' : ''}`}>
                  <div className={`w-8 h-8 flex items-center justify-center font-bold ${getMedalColor(index)}`}>
                    {index < 3 ? <Medal className="w-6 h-6" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{entry.username}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> {entry.highest_streak} best</span>
                      <span>{entry.total_wins} wins</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-veno-primary">{entry.current_streak}</div>
                    <div className="text-xs text-muted-foreground">streak</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakChallengeLeaderboard;
