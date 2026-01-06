import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Clock } from 'lucide-react';

interface StatsWidgetProps {
  testsCompleted?: number;
  averageScore?: number;
  studyTime?: string;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({
  testsCompleted = 0,
  averageScore = 0,
  studyTime = '0h',
}) => {
  const navigate = useNavigate();

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/cbt/analytics')}
      className="w-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-4 text-left border border-primary/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Trophy className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium">Your Stats</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Target className="h-3 w-3" />
          </div>
          <div className="text-lg font-bold">{testsCompleted}</div>
          <div className="text-[10px] text-muted-foreground">Tests</div>
        </div>
        
        <div className="text-center border-x border-border/50">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Trophy className="h-3 w-3" />
          </div>
          <div className="text-lg font-bold">{averageScore}%</div>
          <div className="text-[10px] text-muted-foreground">Avg</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Clock className="h-3 w-3" />
          </div>
          <div className="text-lg font-bold">{studyTime}</div>
          <div className="text-[10px] text-muted-foreground">Time</div>
        </div>
      </div>
    </motion.button>
  );
};
