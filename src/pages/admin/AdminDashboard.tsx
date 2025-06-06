
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, FileText, HelpCircle, TrendingUp, Activity, AlertCircle, UserCheck, Clock } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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
      console.log('Fetching dashboard statistics...');

      // Fetch user profiles directly
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from('user_profiles')
        .select('*');

      if (userProfilesError) {
        console.warn('Error fetching user profiles:', userProfilesError);
      }

      // Calculate user stats manually
      const totalUsers = userProfiles?.length || 0;
      const verifiedUsers = userProfiles?.filter(user => user.is_verified).length || 0;
      const totalPoints = userProfiles?.reduce((sum, user) => sum + (user.points || 0), 0) || 0;
      
      // Calculate recent signups (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentSignups = userProfiles?.filter(user => 
        new Date(user.created_at) >= sevenDaysAgo
      ).length || 0;

      console.log('User stats:', { totalUsers, verifiedUsers, totalPoints, recentSignups });

      // Fetch questions count  
      const { count: questionCount, error: questionsError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      if (questionsError) {
        console.warn('Error fetching questions count:', questionsError);
      }

      // Fetch blog posts count
      const { count: blogCount, error: blogError } = await supabase
        .from('blog_articles')
        .select('*', { count: 'exact', head: true });

      if (blogError) {
        console.warn('Error fetching blog count:', blogError);
      }

      // Fetch recent test attempts for activity (last 7 days instead of 24 hours)
      const { count: activityCount, error: activityError } = await supabase
        .from('test_attempts')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (activityError) {
        console.warn('Error fetching activity count:', activityError);
      }

      // Fetch activity data for chart (last 7 days)
      const { data: chartData, error: chartError } = await supabase
        .from('test_attempts')
        .select('completed_at')
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: true });

      if (chartError) {
        console.warn('Error fetching chart data:', chartError);
      }

      // Process chart data - group by day for the last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: date.toDateString(),
          count: 0
        });
      }

      // Count attempts per day
      if (chartData) {
        chartData.forEach(attempt => {
          const attemptDate = new Date(attempt.completed_at).toDateString();
          const dayData = last7Days.find(day => day.fullDate === attemptDate);
          if (dayData) {
            dayData.count++;
          }
        });
      }

      // Remove fullDate for chart display
      const chartArray = last7Days.map(({ date, count }) => ({ date, count }));

      // Consolidate all stats
      setStats({
        totalUsers,
        verifiedUsers,
        totalPoints,
        recentSignups,
        totalQuestions: questionCount || 0,
        totalBlogPosts: blogCount || 0,
        recentActivity: activityCount || 0
      });

      setActivityData(chartArray);
      console.log('Dashboard stats loaded successfully');
      toast.success('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error(`Failed to load dashboard statistics: ${error.message}`);
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
