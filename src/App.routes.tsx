import React from 'react';
import { RouteObject } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Index from './pages/Index';
import CbtPage from './pages/CbtPage';
import MarketplacePage from './pages/MarketplacePage';
import BlogPage from './pages/BlogPage';
import BotPage from './pages/BotPage';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import RewardSystem from './pages/RewardSystem';
import CBTIndex from './pages/cbt/index';
import CreateTest from './pages/cbt/CreateTest';
import TakeTest from './pages/cbt/TakeTest';
import ManageTest from './pages/cbt/ManageTest';
import Analytics from './pages/cbt/Analytics';
import Library from './pages/cbt/Library';
import Leaderboard from './pages/cbt/Leaderboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import UnderMaintenancePage from './pages/UnderMaintenancePage';
import ContactPage from './pages/ContactPage';
import ServicesPage from './pages/ServicesPage';
import ProtectedRoute from './components/ProtectedRoute';

const lazyLoad = (Component: React.ComponentType<any>): React.ReactNode => {
  const LazyComponent = React.lazy(() => 
    Promise.resolve({ default: Component })
  );
  
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </React.Suspense>
  );
};

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { 
        index: true, 
        element: <ProtectedRoute><Index /></ProtectedRoute> 
      },
      { 
        path: 'cbt', 
        element: <ProtectedRoute><CbtPage /></ProtectedRoute>
      },
      { 
        path: 'marketplace', 
        element: <ProtectedRoute><MarketplacePage /></ProtectedRoute>
      },
      { 
        path: 'blog', 
        element: <ProtectedRoute><BlogPage /></ProtectedRoute>
      },
      { 
        path: 'bot', 
        element: <ProtectedRoute><BotPage /></ProtectedRoute>
      },
      { path: 'auth', element: <AuthPage /> },
      { path: 'signin', element: <AuthPage initialMode="signin" /> },
      { path: 'signup', element: <AuthPage initialMode="signup" /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'maintenance', element: <UnderMaintenancePage /> },
      { path: 'services', element: <ServicesPage /> },
      { 
        path: 'profile',
        element: <ProtectedRoute><ProfilePage /></ProtectedRoute>
      },
      { 
        path: 'settings',
        element: <ProtectedRoute><SettingsPage /></ProtectedRoute>
      },
      { 
        path: 'dashboard',
        element: <ProtectedRoute><DashboardPage /></ProtectedRoute>
      },
      { 
        path: 'rewards',
        element: <ProtectedRoute><RewardSystem /></ProtectedRoute>
      },
      {
        path: 'privacy-policy',
        element: <PrivacyPolicy />
      },
      {
        path: 'terms-of-service',
        element: <TermsOfService />
      },
      {
        path: 'cbt',
        children: [
          { index: true, element: <ProtectedRoute><CBTIndex /></ProtectedRoute> },
          { path: 'create', element: <ProtectedRoute><CreateTest /></ProtectedRoute> },
          { path: 'take/:shareCode', element: <ProtectedRoute><TakeTest /></ProtectedRoute> },
          { path: 'manage/:testId', element: <ProtectedRoute><ManageTest /></ProtectedRoute> },
          { path: 'analytics', element: <ProtectedRoute><Analytics /></ProtectedRoute> },
          { path: 'analytics/:testId', element: <ProtectedRoute><Analytics /></ProtectedRoute> },
          { path: 'library', element: <ProtectedRoute><Library /></ProtectedRoute> },
          { path: 'leaderboard/:testId', element: <ProtectedRoute><Leaderboard /></ProtectedRoute> }
        ]
      },
      { path: '*', element: <NotFound /> }
    ]
  }
];
