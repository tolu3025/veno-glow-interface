import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PWAHeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const PWAHeader: React.FC<PWAHeaderProps> = ({ 
  title, 
  showBack = false,
  rightAction 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/pwa/home';

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 safe-area-pt"
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack && !isHome && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 -ml-2"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {rightAction}
          {isHome && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
};
