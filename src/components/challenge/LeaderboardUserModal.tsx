import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Flame, Swords, Target, TrendingUp, TrendingDown, Award, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UserStats {
  user_id: string;
  username: string;
  current_streak: number;
  highest_streak: number;
  total_wins: number;
  total_challenges: number;
  rank: number;
  previousRank?: number;
}

interface LeaderboardUserModalProps {
  user: UserStats | null;
  currentUser?: UserStats | null;
  isOpen: boolean;
  onClose: () => void;
  onChallenge?: (userId: string) => void;
}

const LeaderboardUserModal = ({ user, currentUser, isOpen, onClose, onChallenge }: LeaderboardUserModalProps) => {
  if (!user) return null;

  const winRate = user.total_challenges > 0 
    ? Math.round((user.total_wins / user.total_challenges) * 100) 
    : 0;

  const currentUserWinRate = currentUser?.total_challenges 
    ? (currentUser.total_wins / currentUser.total_challenges) 
    : 0;

  // Calculate win probability based on relative stats
  const calculateWinProbability = () => {
    if (!currentUser || currentUser.user_id === user.user_id) return null;
    
    const userStrength = (user.total_wins * 2) + user.current_streak + user.highest_streak;
    const myStrength = (currentUser.total_wins * 2) + currentUser.current_streak + currentUser.highest_streak;
    
    if (userStrength === 0 && myStrength === 0) return 50;
    
    const probability = Math.round((myStrength / (userStrength + myStrength)) * 100);
    return Math.max(5, Math.min(95, probability)); // Clamp between 5-95%
  };

  const winProbability = calculateWinProbability();

  const getTierInfo = (streak: number) => {
    if (streak >= 30) return { tier: "Legendary", color: "from-purple-500 via-pink-500 to-red-500", emoji: "👑" };
    if (streak >= 14) return { tier: "Epic", color: "from-blue-500 via-cyan-400 to-teal-500", emoji: "💎" };
    if (streak >= 7) return { tier: "Rare", color: "from-orange-500 via-amber-500 to-yellow-500", emoji: "⚡" };
    if (streak >= 3) return { tier: "Common", color: "from-orange-600 to-red-500", emoji: "🔥" };
    return { tier: "Starter", color: "from-orange-400 to-orange-600", emoji: "✨" };
  };

  const tierInfo = getTierInfo(user.current_streak);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Player Stats</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center",
                "bg-gradient-to-br", tierInfo.color
              )}
            >
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            </motion.div>
            <h3 className="text-xl font-bold">{user.username}</h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-lg">{tierInfo.emoji}</span>
              <span className={cn(
                "font-semibold bg-gradient-to-r bg-clip-text text-transparent",
                tierInfo.color
              )}>
                {tierInfo.tier} Tier
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">Rank #{user.rank}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <div className="text-2xl font-bold">{user.current_streak}</div>
              <div className="text-xs text-muted-foreground">Current Streak</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Award className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <div className="text-2xl font-bold">{user.highest_streak}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <div className="text-2xl font-bold">{user.total_wins}</div>
              <div className="text-xs text-muted-foreground">Total Wins</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Swords className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-bold">{user.total_challenges}</div>
              <div className="text-xs text-muted-foreground">Battles</div>
            </div>
          </div>

          {/* Win Rate */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-semibold">{winRate}%</span>
            </div>
            <Progress value={winRate} className="h-2" />
          </div>

          {/* Win Probability Against This User */}
          {winProbability !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-xl border-2",
                winProbability >= 50 
                  ? "bg-green-500/10 border-green-500/30" 
                  : "bg-red-500/10 border-red-500/30"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Win Probability</span>
                {winProbability >= 50 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${winProbability}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      winProbability >= 50 ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                </div>
                <span className={cn(
                  "font-bold text-lg",
                  winProbability >= 50 ? "text-green-500" : "text-red-500"
                )}>
                  {winProbability}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {winProbability >= 70 
                  ? "You have a strong advantage!" 
                  : winProbability >= 50 
                    ? "You have a slight edge" 
                    : winProbability >= 30 
                      ? "This will be challenging" 
                      : "Tough opponent - bring your A-game!"}
              </p>
            </motion.div>
          )}

          {/* Challenge Button */}
          {onChallenge && currentUser && currentUser.user_id !== user.user_id && (
            <Button 
              onClick={() => onChallenge(user.user_id)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Swords className="w-4 h-4 mr-2" />
              Challenge {user.username}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardUserModal;
