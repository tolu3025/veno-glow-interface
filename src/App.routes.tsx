
import React from 'react';
import { RouteObject } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Index from './pages/Index';
import CbtPage from './pages/CbtPage';
import TutorialPage from './pages/TutorialPage';
import TutorialInfo from './pages/TutorialInfo';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import BotPage from './pages/BotPage';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import CBTIndex from './pages/cbt/index';
import CreateTest from './pages/cbt/CreateTest';
import QuestionBank from './pages/cbt/QuestionBank';
import TakeTest from './pages/cbt/TakeTest';
import ManageTest from './pages/cbt/ManageTest';
import Analytics from './pages/cbt/Analytics';
import Library from './pages/cbt/Library';
import Leaderboard from './pages/cbt/Leaderboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AdsPolicy from './pages/AdsPolicy';
import UnderMaintenancePage from './pages/UnderMaintenancePage';
import ContactPage from './pages/ContactPage';
import ServicesPage from './pages/ServicesPage';
import ProtectedRoute from './components/ProtectedRoute';
import VideoPlayerPage from './pages/VideoPlayerPage';

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
        element: <Index /> 
      },
      { 
        path: 'cbt', 
        element: <ProtectedRoute><CbtPage /></ProtectedRoute>
      },
      { 
        path: 'tutorial', 
        element: <ProtectedRoute><TutorialPage /></ProtectedRoute>
      },
      { 
        path: 'tutorial/info', 
        element: <ProtectedRoute><TutorialInfo /></ProtectedRoute>
      },
      { 
        path: 'blog', 
        element: <BlogPage /> 
      },
      { 
        path: 'blog/:postId', 
        element: <BlogPostPage /> 
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
        path: 'privacy-policy',
        element: <PrivacyPolicy />
      },
      {
        path: 'terms-of-service',
        element: <TermsOfService />
      },
      {
        path: 'ads-policy',
        element: <AdsPolicy />
      },
      {
        path: 'cbt',
        children: [
          { index: true, element: <ProtectedRoute><CBTIndex /></ProtectedRoute> },
          { path: 'create', element: <ProtectedRoute><CreateTest /></ProtectedRoute> },
          { path: 'question-bank', element: <ProtectedRoute><QuestionBank /></ProtectedRoute> },
          { path: 'take/:shareCode', element: <ProtectedRoute><TakeTest /></ProtectedRoute> },
          { path: 'manage/:testId', element: <ProtectedRoute><ManageTest /></ProtectedRoute> },
          { path: 'analytics', element: <ProtectedRoute><Analytics /></ProtectedRoute> },
          { path: 'analytics/:testId', element: <ProtectedRoute><Analytics /></ProtectedRoute> },
          { path: 'library', element: <Library /> },
          { path: 'leaderboard/:testId', element: <ProtectedRoute><Leaderboard /></ProtectedRoute> }
        ]
      },
      { 
        path: 'tutorial/watch', 
        element: <ProtectedRoute><VideoPlayerPage /></ProtectedRoute>
      },
      { path: '*', element: <NotFound /> }
    ]
  }
];
