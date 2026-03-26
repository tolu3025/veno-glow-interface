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
  Bot, 
  Gamepad2, 
  FileUp, 
  FileQuestion, 
  BarChart3
} from 'lucide-react';

const apps = [
  { icon: BookOpen, label: 'CBT Tests', href: '/cbt', gradient: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  { icon: Bot, label: 'AI Assistant', href: '/ai-assistant', gradient: 'bg-gradient-to-br from-pink-500 to-rose-500' },
  { icon: Gamepad2, label: 'Challenge', href: '/cbt/streak-challenge', gradient: 'bg-gradient-to-br from-green-500 to-green-600' },
  { icon: FileUp, label: 'Course Material', href: '/cbt/course-material-test', gradient: 'bg-gradient-to-br from-cyan-500 to-blue-500' },
  { icon: FileQuestion, label: 'Past Q\'s', href: '/cbt/past-questions', gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
  { icon: BarChart3, label: 'Analytics', href: '/cbt/analytics', gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
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
      transition: { staggerChildren: 0.05 },
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

      {/* Widgets */}
      <div className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StreakWidget />
          <StatsWidget testsCompleted={12} averageScore={78} studyTime="5h" />
        </div>
      </div>

      {/* App Grid */}
      <div className="px-5 pt-2 pb-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Quick Actions</h2>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-y-6 gap-x-4"
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

      <PWATabBar />
    </div>
  );
};

export default PWAHome;
