
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import AppNavigation from '@/components/cbt/AppNavigation';
import QuizSection from '@/components/cbt/QuizSection';
import MyTestsSection from '@/components/cbt/MyTestsSection';
import { Trophy } from 'lucide-react';
import { SoundToggle } from '@/components/ui/SoundToggle';

const CBTIndex = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userTests, setUserTests] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserTests = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_tests')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setUserTests(data || []);
      } catch (error: any) {
        toast.error(`Failed to fetch tests: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTests();
  }, [user]);

  const handleShare = (testId: string) => {
    // Add a handling function for the share action
    const test = userTests.find(t => t.id === testId);
    if (test) {
      // Copy share code to clipboard
      navigator.clipboard.writeText(test.share_code)
        .then(() => toast.success(`Share code '${test.share_code}' copied to clipboard!`))
        .catch(err => toast.error("Failed to copy share code"));
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <AppNavigation />
        
        {/* Featured Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 md:p-6 rounded-xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Computer Based Testing</h2>
              <p className="text-muted-foreground max-w-lg">
                Create tests, manage questions, and track performance with our comprehensive CBT platform.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button onClick={() => navigate('/cbt/create')} className="w-full sm:w-auto">
                  Create New Test
                </Button>
                <Button variant="outline" onClick={() => navigate('/cbt/public-leaderboards')} className="flex items-center gap-2 w-full sm:w-auto">
                  <Trophy className="h-4 w-4" />
                  Leaderboards
                </Button>
                <SoundToggle />
              </div>
            </div>
            <div className="h-24 w-24 md:h-32 md:w-32 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-3xl md:text-4xl">📝</span>
            </div>
          </div>
        </div>
        
        {/* Quick Test Section */}
        <QuizSection />
        
        {/* My Tests Section */}
        <MyTestsSection 
          tests={userTests} 
          loading={loading} 
          onShare={handleShare} 
        />
      </div>
    </div>
  );
};

export default CBTIndex;
