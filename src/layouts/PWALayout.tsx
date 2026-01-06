import React from 'react';
import { Outlet } from 'react-router-dom';
import { PWATabBar } from '@/components/pwa/PWATabBar';
import { PWAHeader } from '@/components/pwa/PWAHeader';

interface PWALayoutProps {
  children?: React.ReactNode;
  title?: string;
  showBack?: boolean;
  hideTabBar?: boolean;
  rightAction?: React.ReactNode;
}

export const PWALayout: React.FC<PWALayoutProps> = ({ 
  children, 
  title,
  showBack = true,
  hideTabBar = false,
  rightAction,
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PWAHeader title={title} showBack={showBack} rightAction={rightAction} />
      
      <main className="flex-1 pb-20">
        {children || <Outlet />}
      </main>
      
      {!hideTabBar && <PWATabBar />}
    </div>
  );
};

export default PWALayout;
