import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface AppIconProps {
  icon: LucideIcon;
  label: string;
  href: string;
  gradient: string;
  badge?: number;
  locked?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({
  icon: Icon,
  label,
  href,
  gradient,
  badge,
  locked = false,
}) => {
  const navigate = useNavigate();

  const handleTap = () => {
    if (!locked) {
      navigate(href);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleTap}
      className="flex flex-col items-center gap-1.5 w-full"
    >
      <div className="relative">
        <div 
          className={`h-[60px] w-[60px] rounded-[14px] flex items-center justify-center shadow-lg ${gradient} ${locked ? 'opacity-50' : ''}`}
        >
          <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
        </div>
        
        {/* Badge */}
        {badge && badge > 0 && (
          <div className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-destructive rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-destructive-foreground">
              {badge > 99 ? '99+' : badge}
            </span>
          </div>
        )}

        {/* Lock overlay */}
        {locked && (
          <div className="absolute inset-0 rounded-[14px] bg-background/50 flex items-center justify-center">
            <span className="text-xs">🔒</span>
          </div>
        )}
      </div>
      
      <span className="text-[11px] text-foreground/80 font-medium truncate max-w-[70px] text-center leading-tight">
        {label}
      </span>
    </motion.button>
  );
};
