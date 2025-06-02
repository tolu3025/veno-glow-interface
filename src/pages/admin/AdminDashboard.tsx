
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, FileText, HelpCircle, TrendingUp, Activity, AlertCircle, UserCheck, Clock } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

type UserActivitySummary = {
  total_users: number;
  verified_users: number;
  total_points: number;
  recent_signups: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalBlogPosts: 0,
    recentActivity: 0,
    verifiedUsers: 0,
    totalPoints: 0,
    recentSignups: 0
  });
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Get user activity summary using the new function
      const { data: userActivity, error: userActivityError } = await supabase
        .rpc('get_user_activity_summary');

      if (userActivityError) throw userActivityError;

      // Fetch questions count  
      const { count: questionCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      // Fetch blog posts count
      const { count: blogCount } = await supabase
        .from('blog_articles')
        .select('*', { count: 'exact', head: true });

      // Fetch recent test attempts for activity
      const { count: activityCount } = await supabase
        .from('test_attempts')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Fetch activity data for chart
      const { data: chartData } = await supabase
        .from('test_attempts')
        .select('completed_at')
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: true });

      // Process chart data
      const dailyActivity = chartData?.reduce((acc, attempt) => {
        const date = new Date(attempt.completed_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const chartArray = Object.entries(dailyActivity || {}).map(([date, count]) => ({
        date,
        count
      }));

      // Consolidate all stats
      setStats({
        totalUsers: userActivity?.[0]?.total_users || 0,
        verifiedUsers: userActivity?.[0]?.verified_users || 0,
        totalPoints: userActivity?.[0]?.total_points || 0,
        recentSignups: userActivity?.[0]?.recent_signups || 0,
        totalQuestions: questionCount || 0,
        totalBlogPosts: blogCount || 0,
        recentActivity: activityCount || 0
      });

      setActivityData(chartArray);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform's performance and activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <UserCheck className="mr-1 h-3 w-3" />
              {stats.verifiedUsers} verified ({Math.round((stats.verifiedUsers / stats.totalUsers) * 100) || 0}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              Questions in the database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBlogPosts}</div>
            <p className="text-xs text-muted-foreground">
              Published blog articles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">
              Test attempts this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* New User Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>User Statistics</CardTitle>
          <CardDescription>
            Overview of user activity and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">New Signups (7 days)</div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{stats.recentSignups}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Total Points Earned</div>
              <div className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Average Points per User</div>
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">
                  {stats.totalUsers > 0 
                    ? Math.round(stats.totalPoints / stats.totalUsers).toLocaleString() 
                    : 0}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>
            Test attempts over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p>No activity data available for the past week</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => window.location.href = '/admin/questions'}>
              <HelpCircle className="mr-2 h-4 w-4" />
              Manage Questions
            </Button>
            <Button onClick={() => window.location.href = '/admin/blog'}>
              <FileText className="mr-2 h-4 w-4" />
              Manage Blog Posts
            </Button>
            <Button onClick={() => window.location.href = '/admin/user-management'}>
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button onClick={() => window.location.href = '/admin/assign-admin'}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Assign Admin Role
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
