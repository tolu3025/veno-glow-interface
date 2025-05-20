
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/providers/AuthProvider';
import { Chart } from "@/components/ui/chart";
import { Activity, Users, FileText, Settings, Loader } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    tests: 0,
    questions: 0,
    tutorials: 0,
    blogPosts: 0,
    activeUsers: 0
  });
  const [weeklySignups, setWeeklySignups] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch user count
        const { count: usersCount, error: usersError } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });
        
        if (usersError) throw usersError;
        
        // Fetch tests count
        const { count: testsCount, error: testsError } = await supabase
          .from('user_tests')
          .select('*', { count: 'exact', head: true });
          
        // Fetch questions count
        const { count: questionsCount, error: questionsError } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true });
          
        // Fetch tutorials count
        const { count: tutorialsCount, error: tutorialsError } = await supabase
          .from('tutorials')
          .select('*', { count: 'exact', head: true });
          
        // Fetch blog posts count
        const { count: blogPostsCount, error: blogPostsError } = await supabase
          .from('blog_articles')
          .select('*', { count: 'exact', head: true });

        // Calculate active users (users with test attempts in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { count: activeUsersCount, error: activeUsersError } = await supabase
          .from('test_attempts')
          .select('user_id', { count: 'exact', head: true })
          .gt('completed_at', thirtyDaysAgo.toISOString())
          .not('user_id', 'is', null);

        // Get recent activities
        const { data: activities, error: activitiesError } = await supabase
          .from('test_attempts')
          .select('participant_email, completed_at, subject, score')
          .order('completed_at', { ascending: false })
          .limit(5);
        
        if (activitiesError) throw activitiesError;
        
        // Get weekly signups data
        const signupsByDay = await getWeeklySignups();

        setStats({
          users: usersCount || 0,
          tests: testsCount || 0,
          questions: questionsCount || 0,
          tutorials: tutorialsCount || 0,
          blogPosts: blogPostsCount || 0,
          activeUsers: activeUsersCount || 0
        });
        
        setWeeklySignups(signupsByDay);
        setRecentActivities(activities || []);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getWeeklySignups = async () => {
    // Get dates for the last 7 days
    const days = [];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date.toISOString());
    }
    
    // For each day, get signups
    try {
      for (let i = 0; i < 7; i++) {
        const startDate = days[i];
        const endDate = i < 6 ? days[i + 1] : new Date().toISOString();
        
        const { count, error } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate)
          .lt('created_at', endDate);
          
        if (!error && count !== null) {
          counts[i] = count;
        }
      }
      
      return counts;
    } catch (error) {
      console.error('Error fetching weekly signups:', error);
      return [0, 0, 0, 0, 0, 0, 0];
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email?.split('@')[0]}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active in last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.questions} questions available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users > 0 ? Math.round((stats.activeUsers / stats.users) * 100) : 0}% of total users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tutorials + stats.blogPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.tutorials} tutorials, {stats.blogPosts} blog posts
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>New User Signups</CardTitle>
            <CardDescription>Past 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Chart
              type="bar"
              width={650}
              height={350}
              series={[
                {
                  name: "New Users",
                  data: weeklySignups.map((value, index) => ({ name: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index], value })),
                },
              ]}
              options={{
                chart: {
                  toolbar: {
                    show: false,
                  },
                },
                plotOptions: {
                  bar: {
                    borderRadius: 3,
                    horizontal: false,
                  },
                },
                dataLabels: {
                  enabled: false,
                },
                xaxis: {
                  categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                },
              }}
            />
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest test attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activities found</p>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center">
                    <div className="mr-2 h-2 w-2 rounded-full bg-blue-600" />
                    <div className="text-sm">
                      {activity.participant_email} completed {activity.subject} test
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {new Date(activity.completed_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
