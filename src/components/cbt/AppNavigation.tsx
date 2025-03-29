
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Trophy, Award, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import MobileMenu from '@/components/ui/mobile-menu';

const AppNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const mainLinks = [
    { name: "Home", path: "/" },
    { name: "CBT", path: "/cbt" },
    { name: "Marketplace", path: "/marketplace" },
    { name: "Blog", path: "/blog" }
  ];
  
  const appLinks = [
    {
      name: 'Dashboard',
      path: '/cbt',
      icon: Home
    },
    {
      name: 'My Tests',
      path: '/cbt?tab=mytests',
      icon: BookOpen
    },
    {
      name: 'Analytics',
      path: '/cbt/analytics',
      icon: Trophy,
      requiresAuth: true
    },
    {
      name: 'Rewards',
      path: '/rewards',
      icon: Award,
      requiresAuth: true
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
      requiresAuth: true
    }
  ];

  const isActive = (path: string) => {
    if (path === '/cbt?tab=mytests') {
      return location.pathname === '/cbt' && location.search.includes('tab=mytests');
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Navigation Menu (visible on top of the page via the MainLayout) */}
      <div className="md:hidden flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Veno</h1>
        </div>
      </div>

      {/* Desktop Sidebar - Only visible on larger screens */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-background border-r p-4 z-10">
        <div className="flex items-center mb-8">
          <h2 className="text-xl font-bold">Veno</h2>
        </div>
        
        <nav className="flex flex-col gap-2">
          {appLinks.map((item) => (
            <Button
              key={item.name}
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={`justify-start ${
                isActive(item.path) ? 'text-veno-primary bg-primary/10' : ''
              }`}
              onClick={() => navigate(item.path)}
              disabled={item.requiresAuth && !user}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.name}
            </Button>
          ))}
        </nav>
        
        {!user && (
          <Button 
            className="mt-8 w-full bg-veno-primary hover:bg-veno-primary/90" 
            onClick={() => navigate('/auth')}
          >
            Sign In
          </Button>
        )}
      </div>
    </>
  );
};

export default AppNavigation;
