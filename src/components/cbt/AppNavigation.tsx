
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Trophy, Award, Settings, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/providers/AuthProvider';
import { VenoLogo } from '@/components/ui/logo';

const AppNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const navItems = [
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
      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <nav className="flex justify-around items-center p-2">
          {navItems.slice(0, 5).map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center px-2 py-3 ${
                isActive(item.path) ? 'text-veno-primary' : 'text-muted-foreground'
              }`}
              onClick={() => navigate(item.path)}
              disabled={item.requiresAuth && !user}
            >
              <item.icon size={20} />
              <span className="text-xs mt-1">{item.name}</span>
            </Button>
          ))}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="flex flex-col items-center px-2 py-3">
                <Menu size={20} />
                <span className="text-xs mt-1">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex items-center mb-6">
                  <VenoLogo className="h-6 w-6 mr-2" />
                  <h2 className="text-xl font-bold">Veno</h2>
                </div>
                
                {navItems.map((item) => (
                  <Button
                    key={item.name}
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    size="lg" 
                    className={`justify-start ${
                      isActive(item.path) ? 'text-veno-primary' : ''
                    }`}
                    onClick={() => navigate(item.path)}
                    disabled={item.requiresAuth && !user}
                  >
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.name}
                  </Button>
                ))}
                
                {!user && (
                  <Button 
                    className="mt-4 w-full bg-veno-primary hover:bg-veno-primary/90" 
                    onClick={() => navigate('/auth')}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-background border-r p-4 z-10">
        <div className="flex items-center mb-8">
          <VenoLogo className="h-6 w-6 mr-2" />
          <h2 className="text-xl font-bold">Veno</h2>
        </div>
        
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
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
