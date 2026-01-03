import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnlockCountdownProps {
  expiresAt: string;
  className?: string;
  onExpire?: () => void;
}

export const UnlockCountdown: React.FC<UnlockCountdownProps> = ({
  expiresAt,
  className,
  onExpire
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        onExpire?.();
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Warning when less than 1 hour
      setIsWarning(hours < 1);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (isExpired) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20",
        className
      )}>
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="text-sm font-medium text-destructive">Access Expired</span>
      </div>
    );
  }

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
        isWarning 
          ? "bg-amber-500/10 border-amber-500/20" 
          : "bg-primary/10 border-primary/20",
        className
      )}
      animate={isWarning ? { scale: [1, 1.02, 1] } : undefined}
      transition={{ repeat: isWarning ? Infinity : 0, duration: 2 }}
    >
      <Clock className={cn(
        "h-4 w-4",
        isWarning ? "text-amber-500" : "text-primary"
      )} />
      <span className={cn(
        "text-sm font-medium",
        isWarning ? "text-amber-500" : "text-primary"
      )}>
        {timeLeft.hours > 0 && `${timeLeft.hours}h `}
        {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s
      </span>
      {isWarning && (
        <span className="text-xs text-amber-500/80 ml-1">remaining</span>
      )}
    </motion.div>
  );
};

export default UnlockCountdown;
