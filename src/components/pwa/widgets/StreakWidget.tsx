import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Flame, TrendingUp } from 'lucide-react';
import { useStreak } from '@/providers/StreakProvider';

export const StreakWidget: React.FC = () => {
  const navigate = useNavigate();
  const { streak } = useStreak();

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/streak-analytics')}
      className="w-full bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-4 text-left border border-orange-500/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <span className="text-sm font-medium">Streak</span>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex items-end gap-4">
        <div>
          <div className="text-3xl font-bold">{streak.currentStreak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
        <div className="flex-1 text-right">
          <div className="text-xs text-muted-foreground">Points</div>
          <div className="text-lg font-semibold text-orange-500">{streak.points}</div>
        </div>
      </div>
    </motion.button>
  );
};
