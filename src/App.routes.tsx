
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
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ContactPage from './pages/ContactPage';
import ProtectedRoute from './components/ProtectedRoute';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Index /> },
      { path: 'cbt', element: <CbtPage /> },
      { path: 'marketplace', element: <MarketplacePage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'bot', element: <BotPage /> },
      { path: 'auth', element: <AuthPage /> },
      { path: 'contact', element: <ContactPage /> },
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
        element: <RewardSystem />
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
          { index: true, element: <CBTIndex /> },
          { path: 'create-test', element: <ProtectedRoute><CreateTest /></ProtectedRoute> },
          { path: 'take-test/:shareCode', element: <TakeTest /> },
          { path: 'manage/:testId', element: <ProtectedRoute><ManageTest /></ProtectedRoute> },
          { path: 'analytics', element: <ProtectedRoute><Analytics /></ProtectedRoute> }
        ]
      },
      { path: '*', element: <NotFound /> }
    ]
  }
];
