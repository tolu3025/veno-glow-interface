import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface TabItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const tabs: TabItem[] = [
  { icon: Home, label: 'Home', href: '/pwa/home' },
  { icon: BookOpen, label: 'Tests', href: '/cbt' },
  { icon: GraduationCap, label: 'Learn', href: '/ai-assistant' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export const PWATabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) => {
    if (href === '/pwa/home') {
      return location.pathname === '/pwa/home';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          
          return (
            <motion.button
              key={tab.href}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(tab.href)}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <div className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon className="h-6 w-6" strokeWidth={active ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </div>
              
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
