import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/AuthProvider';
import { PWATabBar } from '@/components/pwa/PWATabBar';
import { AppIcon } from '@/components/pwa/AppIcon';
import { StreakWidget } from '@/components/pwa/widgets/StreakWidget';
import { StatsWidget } from '@/components/pwa/widgets/StatsWidget';
import { VenoLogo } from '@/components/ui/logo';
import { 
  BookOpen, 
  Brain, 
  FileQuestion, 
  Library, 
  Gamepad2, 
  Trophy, 
  Flame, 
  BarChart3,
  Bot,
  Mic,
  Video,
  MessageCircle,
  Building2,
  User,
  Settings,
  LayoutDashboard
} from 'lucide-react';

// App definitions with their gradients
const apps = [
  { icon: BookOpen, label: 'CBT Tests', href: '/cbt', gradient: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  { icon: Brain, label: 'AI Tests', href: '/cbt/ai-create', gradient: 'bg-gradient-to-br from-purple-500 to-purple-600' },
  { icon: FileQuestion, label: 'Past Q\'s', href: '/cbt/past-questions', gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
  { icon: Library, label: 'Library', href: '/cbt/library', gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
  { icon: Gamepad2, label: 'Challenge', href: '/cbt/streak-challenge', gradient: 'bg-gradient-to-br from-green-500 to-green-600' },
  { icon: Trophy, label: 'Leaderboard', href: '/cbt/streak-leaderboard', gradient: 'bg-gradient-to-br from-yellow-500 to-amber-500' },
  { icon: Flame, label: 'Streaks', href: '/streak-analytics', gradient: 'bg-gradient-to-br from-orange-500 to-red-500' },
  { icon: BarChart3, label: 'Analytics', href: '/cbt/analytics', gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
  { icon: Bot, label: 'AI Assistant', href: '/ai-assistant', gradient: 'bg-gradient-to-br from-pink-500 to-rose-500' },
  { icon: Mic, label: 'Voice Tutor', href: '/voice-tutor', gradient: 'bg-gradient-to-br from-teal-500 to-teal-600' },
  { icon: Video, label: 'Tutorials', href: '/tutorial/info', gradient: 'bg-gradient-to-br from-red-500 to-red-600' },
  { icon: MessageCircle, label: 'Bot', href: '/bot', gradient: 'bg-gradient-to-br from-violet-500 to-violet-600' },
  { icon: Building2, label: 'Org Exam', href: '/org-exam', gradient: 'bg-gradient-to-br from-slate-500 to-slate-600' },
  { icon: User, label: 'Profile', href: '/profile', gradient: 'bg-gradient-to-br from-gray-500 to-gray-600' },
  { icon: Settings, label: 'Settings', href: '/settings', gradient: 'bg-gradient-to-br from-zinc-500 to-zinc-600' },
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', gradient: 'bg-gradient-to-br from-sky-500 to-sky-600' },
];

const PWAHome: React.FC = () => {
  const { user } = useAuth();
  
  const displayName = user?.user_metadata?.full_name || 
                      user?.user_metadata?.name ||
                      user?.email?.split('@')[0] || 
                      'Student';

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="safe-area-pt bg-background/95 backdrop-blur-lg sticky top-0 z-40 border-b border-border/50">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
                <VenoLogo className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{greeting()}</p>
                <h1 className="text-lg font-semibold">{displayName}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Widgets Section */}
      <div className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StreakWidget />
          <StatsWidget testsCompleted={12} averageScore={78} studyTime="5h" />
        </div>
      </div>

      {/* App Grid */}
      <div className="px-5 pt-2 pb-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">All Apps</h2>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-4 gap-y-6 gap-x-2"
        >
          {apps.map((app) => (
            <motion.div key={app.href} variants={itemVariants}>
              <AppIcon
                icon={app.icon}
                label={app.label}
                href={app.href}
                gradient={app.gradient}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Tab Bar */}
      <PWATabBar />
    </div>
  );
};

export default PWAHome;
