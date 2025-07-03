
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import MobileMenu from '@/components/ui/mobile-menu';
import { useAuth } from '@/providers/AuthProvider';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, Settings, LogOut, User, Trophy, Bot, ShoppingBag, Briefcase } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export const MainLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
  };

  // Define main navigation links for the mobile menu
  const mainLinks = [
    { name: 'Home', path: '/' },
    { name: 'CBT', path: '/cbt' },
    { name: 'Tutorials', path: '/tutorials' },
    { name: 'Blog', path: '/blog' },
    { name: 'AI Bot', path: '/bot' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Services', path: '/services' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <VenoLogo className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">Veno</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link 
              to="/cbt" 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/cbt') ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>CBT</span>
            </Link>
            <Link 
              to="/tutorials" 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/tutorials') ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Tutorials</span>
            </Link>
            <Link 
              to="/blog" 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/blog') ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Blog</span>
            </Link>
            <Link 
              to="/bot" 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/bot') ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>AI Bot</span>
            </Link>
            <Link 
              to="/marketplace" 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/marketplace') ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Marketplace</span>
            </Link>
            <Link 
              to="/services" 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/services') ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Services</span>
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Account</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <MobileMenu mainLinks={mainLinks} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
