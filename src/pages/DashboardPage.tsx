import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChartPieIcon, BarChart3, Book, ShoppingCart, FileText, Bot, Award, Trophy } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { VenoLogo } from "@/components/ui/logo";
import { supabase } from '@/integrations/supabase/client';
import CertificatesSection from '@/components/certificate/CertificatesSection';

const DashboardPage = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    cbtStats: {
      testsCompleted: 0,
      avgScore: 0,
      questionsAnswered: 0
    },
    marketplaceStats: {
      purchases: 0,
      reviews: 0,
      favoriteItems: 0
    },
    blogStats: {
      articlesRead: 0,
      commentsPosted: 0,
      articlesReadList: [] as {
        article_id: string;
        article_title: string;
        timestamp: string;
      }[]
    },
    botStats: {
      conversationsStarted: 0,
      queriesAnswered: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch user test attempts
        const {
          data: testAttempts,
          error: testError
        } = await supabase.from('test_attempts').select('id, score, total_questions').eq('user_id', user.id);
        if (testError) {
          console.error('Error fetching test attempts:', testError);
        }

        // Fetch user profile
        const {
          data: userProfile,
          error: profileError
        } = await supabase.from('user_profiles').select('activities').eq('user_id', user.id).single();
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        }

        // Calculate CBT statistics
        let avgScore = 0;
        let questionsAnswered = 0;
        if (testAttempts && testAttempts.length > 0) {
          questionsAnswered = testAttempts.reduce((total, attempt) => total + attempt.total_questions, 0);
          const totalScorePercent = testAttempts.reduce((total, attempt) => {
            return total + attempt.score / attempt.total_questions * 100;
          }, 0);
          avgScore = Math.round(totalScorePercent / testAttempts.length);
        }

        // Get blog activities
        let articlesRead = 0;
        let commentsPosted = 0;
        let articlesReadList: {
          article_id: string;
          article_title: string;
          timestamp: string;
        }[] = [];
        
        if (userProfile?.activities) {
          const activities = Array.isArray(userProfile.activities) ? userProfile.activities : [];
          const blogReadActivities = activities.filter((activity: any) => activity.type === 'blog_read');
          articlesRead = blogReadActivities.length;
          
          // Extract article information for reading history
          articlesReadList = blogReadActivities.map((activity: any) => ({
            article_id: activity.article_id,
            article_title: activity.article_title || 'Untitled Article',
            timestamp: activity.timestamp
          })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          commentsPosted = activities.filter((activity: any) => activity.type === 'blog_comment').length;
        }

        // Get marketplace activities
        const {
          count: purchaseCount,
          error: purchaseError
        } = await supabase.from('orders').select('id', {
          count: 'exact'
        }).eq('buyer_id', user.id);
        if (purchaseError) {
          console.error('Error fetching purchase count:', purchaseError);
        }

        // Count bot activities if they exist
        let botConversations = 0;
        let botQueries = 0;
        if (userProfile?.activities) {
          const activities = Array.isArray(userProfile.activities) ? userProfile.activities : [];
          botConversations = activities.filter((activity: any) => activity.type === 'bot_conversation').length;
          botQueries = activities.filter((activity: any) => activity.type === 'bot_query').length;
        }
        setUserData({
          cbtStats: {
            testsCompleted: testAttempts?.length || 0,
            avgScore,
            questionsAnswered
          },
          marketplaceStats: {
            purchases: purchaseCount || 0,
            reviews: 0,
            // Will implement when reviews table is available
            favoriteItems: 0 // Will implement when favorites functionality is available
          },
          blogStats: {
            articlesRead,
            commentsPosted,
            articlesReadList
          },
          botStats: {
            conversationsStarted: botConversations,
            queriesAnswered: botQueries
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();

    // Set up realtime subscriptions for data updates
    const channel = supabase.channel('dashboard-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'test_attempts',
      filter: `user_id=eq.${user.id}`
    }, () => fetchDashboardData()).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_profiles',
      filter: `user_id=eq.${user.id}`
    }, () => fetchDashboardData()).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `buyer_id=eq.${user.id}`
    }, () => fetchDashboardData()).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1
    }
  };
  const [activeTab, setActiveTab] = useState("overview");

  // Asynchronously fetch recent activities
  const getRecentActivities = async () => {
    if (!user) return [];
    try {
      const {
        data,
        error
      } = await supabase.from('user_profiles').select('activities').eq('user_id', user.id).single();
      if (error || !data) return [];
      const activities = Array.isArray(data.activities) ? data.activities : [];
      return activities.slice(0, 5);
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  };
  return <div className="pb-6">
      <div className="flex items-center mb-6">
        <VenoLogo className="h-8 w-8 mr-3" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {user ? <>
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card className="border border-veno-primary/20 bg-gradient-to-br from-card/50 to-card">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                      </h2>
                      <p className="text-muted-foreground">
                        {isLoading ? "Loading your dashboard..." : `You have completed ${userData.cbtStats.testsCompleted} tests`}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex space-x-3">
                      <Button variant="outline" onClick={() => navigate('/profile')} className="border-veno-primary/30 text-veno-primary">
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6">
                <TabsTrigger value="overview" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
                  <ChartPieIcon size={16} className="mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
                  <BarChart3 size={16} className="mr-2" /> Stats
                </TabsTrigger>
                <TabsTrigger value="certificates" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
                  <Award size={16} className="mr-2" /> Certificates
                </TabsTrigger>
              </TabsList>

              <motion.div variants={itemVariants}>
                <TabsContent value="overview" className="animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Book className="h-4 w-4 mr-2 text-veno-primary" />
                          CBT Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{userData.cbtStats.avgScore}%</p>
                        <p className="text-xs text-muted-foreground">Average Test Score</p>
                        <Progress className="mt-2 h-1" value={userData.cbtStats.avgScore} />
                      </CardContent>
                    </Card>
                  </div>

                  <h2 className="text-xl font-medium mb-4">Quick Access</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button onClick={() => navigate('/cbt')} variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                      <Book className="h-6 w-6 text-veno-primary" />
                      <span>Veno CBT</span>
                    </Button>
                    <Button onClick={() => navigate('/marketplace')} variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                      <ShoppingCart className="h-6 w-6 text-veno-primary" />
                      <span>Tutorial</span>
                    </Button>
                    <Button onClick={() => navigate('/blog')} variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                      <FileText className="h-6 w-6 text-veno-primary" />
                      <span>Blog</span>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="animate-fade-in">
                  <Tabs defaultValue="cbt" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="cbt" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
                        <Book size={16} className="mr-2" /> CBT
                      </TabsTrigger>
                      
                      <TabsTrigger value="blog" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
                        <FileText size={16} className="mr-2" /> Blog
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="cbt" className="animate-fade-in">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <BarChart3 className="mr-2 h-5 w-5 text-veno-primary" />
                            CBT Performance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium">Tests Completed</p>
                                <p className="text-sm font-medium">{userData.cbtStats.testsCompleted}</p>
                              </div>
                              <Progress value={userData.cbtStats.testsCompleted / 50 * 100} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium">Questions Answered</p>
                                <p className="text-sm font-medium">{userData.cbtStats.questionsAnswered}</p>
                              </div>
                              <Progress value={userData.cbtStats.questionsAnswered / 500 * 100} className="h-2" />
                            </div>
                            <div className="flex justify-end">
                              <Button variant="outline" onClick={() => navigate('/cbt')} className="border-veno-primary/30 text-veno-primary text-xs mt-2">
                                View CBT Dashboard
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="marketplace" className="animate-fade-in">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <ShoppingCart className="mr-2 h-5 w-5 text-veno-primary" />
                            Marketplace Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium">Purchases</p>
                                <p className="text-sm font-medium">{userData.marketplaceStats.purchases}</p>
                              </div>
                              <Progress value={userData.marketplaceStats.purchases / 10 * 100} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium">Reviews</p>
                                <p className="text-sm font-medium">{userData.marketplaceStats.reviews}</p>
                              </div>
                              <Progress value={userData.marketplaceStats.reviews / 20 * 100} className="h-2" />
                            </div>
                            <div className="flex justify-end">
                              <Button variant="outline" onClick={() => navigate('/marketplace')} className="border-veno-primary/30 text-veno-primary text-xs mt-2">
                                Visit Marketplace
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="blog" className="animate-fade-in">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-veno-primary" />
                            Blog Engagement
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium">Articles Read</p>
                                <p className="text-sm font-medium">{userData.blogStats.articlesRead}</p>
                              </div>
                              <Progress value={userData.blogStats.articlesRead / 30 * 100} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium">Comments Posted</p>
                                <p className="text-sm font-medium">{userData.blogStats.commentsPosted}</p>
                              </div>
                              <Progress value={userData.blogStats.commentsPosted / 15 * 100} className="h-2" />
                            </div>
                            
                            {/* Reading history */}
                            {userData.blogStats.articlesReadList.length > 0 && (
                              <div className="mt-6">
                                <h3 className="text-sm font-medium mb-3">Recently Read Articles</h3>
                                <ul className="space-y-2">
                                  {userData.blogStats.articlesReadList.slice(0, 5).map((article, idx) => (
                                    <li key={idx} className="flex justify-between items-center text-sm p-2 bg-background/50 rounded">
                                      <Button 
                                        variant="link" 
                                        className="p-0 h-auto text-left justify-start"
                                        onClick={() => navigate(`/blog/${article.article_id}`)}
                                      >
                                        {article.article_title}
                                      </Button>
                                      <span className="text-muted-foreground text-xs">
                                        {new Date(article.timestamp).toLocaleDateString()}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex justify-end">
                              <Button variant="outline" onClick={() => navigate('/blog')} className="border-veno-primary/30 text-veno-primary text-xs mt-2">
                                Read Blog
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
                
                <TabsContent value="certificates" className="animate-fade-in">
                  <CertificatesSection />
                </TabsContent>
              </motion.div>
            </Tabs>
          </motion.div>
        </> : <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-medium mb-4">Please Sign In</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to view your dashboard.
            </p>
            <Button className="bg-veno-primary hover:bg-veno-primary/90" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </CardContent>
        </Card>}
    </div>;
};

// Extract the RecentActivities component to handle async data loading
const RecentActivities = ({
  userId
}: {
  userId: string;
}) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from('user_profiles').select('activities').eq('user_id', userId).single();
        if (error) throw error;
        const activityList = Array.isArray(data?.activities) ? data.activities : [];
        setActivities(activityList.slice(0, 5));
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [userId]);
  if (loading) {
    return <p className="text-muted-foreground">Loading activities...</p>;
  }
  if (activities.length === 0) {
    return <p className="text-muted-foreground">No activities yet</p>;
  }
  return <ul className="space-y-2">
      {activities.map((activity: any, index: number) => <li key={index} className="p-3 border rounded-md">
          <div className="flex justify-between">
            <span className="font-medium">{activity.description}</span>
            <span className="text-muted-foreground text-sm">
              {new Date(activity.timestamp).toLocaleDateString()}
            </span>
          </div>
        </li>)}
    </ul>;
};
export default DashboardPage;
