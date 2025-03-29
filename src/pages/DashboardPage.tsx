
import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChartPieIcon, BarChart3, Book, ShoppingCart, FileText, Bot } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { VenoLogo } from "@/components/ui/logo";

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Sample data - in a real app, you would fetch this from an API
  const userData = {
    cbtStats: {
      testsCompleted: 24,
      avgScore: 78,
      questionsAnswered: 248
    },
    marketplaceStats: {
      purchases: 5,
      reviews: 12,
      favoriteItems: 8
    },
    blogStats: {
      articlesRead: 15,
      commentsPosted: 7
    },
    botStats: {
      conversationsStarted: 34,
      queriesAnswered: 120
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="pb-6">
      <div className="flex items-center mb-6">
        <VenoLogo className="h-8 w-8 mr-3" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {user ? (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Welcome Card */}
            <motion.div variants={itemVariants}>
              <Card className="border border-veno-primary/20 bg-gradient-to-br from-card/50 to-card">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                      </h2>
                      <p className="text-muted-foreground">Here's an overview of your activity across all Veno services</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/profile')}
                        className="border-veno-primary/30 text-veno-primary"
                      >
                        View Profile
                      </Button>
                      <Button 
                        onClick={() => navigate('/rewards')}
                        className="bg-veno-primary hover:bg-veno-primary/90"
                      >
                        Rewards
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Overall Stats */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2 text-veno-primary" />
                      Marketplace
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{userData.marketplaceStats.purchases}</p>
                    <p className="text-xs text-muted-foreground">Total Purchases</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-veno-primary" />
                      Blog Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{userData.blogStats.articlesRead}</p>
                    <p className="text-xs text-muted-foreground">Articles Read</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Bot className="h-4 w-4 mr-2 text-veno-primary" />
                      Bot Interactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{userData.botStats.conversationsStarted}</p>
                    <p className="text-xs text-muted-foreground">Conversations</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Detailed Analytics */}
            <motion.div variants={itemVariants}>
              <Tabs defaultValue="cbt" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="cbt" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
                    <Book size={16} className="mr-2" /> CBT
                  </TabsTrigger>
                  <TabsTrigger value="marketplace" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
                    <ShoppingCart size={16} className="mr-2" /> Marketplace
                  </TabsTrigger>
                  <TabsTrigger value="blog" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
                    <FileText size={16} className="mr-2" /> Blog
                  </TabsTrigger>
                  <TabsTrigger value="bot" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
                    <Bot size={16} className="mr-2" /> Bot
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
                          <Button 
                            variant="outline" 
                            onClick={() => navigate('/cbt')}
                            className="border-veno-primary/30 text-veno-primary text-xs mt-2"
                          >
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
                          <Button 
                            variant="outline" 
                            onClick={() => navigate('/marketplace')}
                            className="border-veno-primary/30 text-veno-primary text-xs mt-2"
                          >
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
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => navigate('/blog')}
                            className="border-veno-primary/30 text-veno-primary text-xs mt-2"
                          >
                            Read Blog
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="bot" className="animate-fade-in">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bot className="mr-2 h-5 w-5 text-veno-primary" />
                        Bot Interactions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">Conversations</p>
                            <p className="text-sm font-medium">{userData.botStats.conversationsStarted}</p>
                          </div>
                          <Progress value={userData.botStats.conversationsStarted / 50 * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">Queries Answered</p>
                            <p className="text-sm font-medium">{userData.botStats.queriesAnswered}</p>
                          </div>
                          <Progress value={userData.botStats.queriesAnswered / 200 * 100} className="h-2" />
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => navigate('/bot')}
                            className="border-veno-primary/30 text-veno-primary text-xs mt-2"
                          >
                            Chat with Bot
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Quick Access */}
            <motion.div variants={itemVariants}>
              <h2 className="text-xl font-medium mb-4">Quick Access</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  onClick={() => navigate('/cbt')} 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                >
                  <Book className="h-6 w-6 text-veno-primary" />
                  <span>Veno CBT</span>
                </Button>
                <Button 
                  onClick={() => navigate('/marketplace')} 
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-6 w-6 text-veno-primary" />
                  <span>Marketplace</span>
                </Button>
                <Button 
                  onClick={() => navigate('/blog')} 
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                >
                  <FileText className="h-6 w-6 text-veno-primary" />
                  <span>Blog</span>
                </Button>
                <Button 
                  onClick={() => navigate('/bot')} 
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                >
                  <Bot className="h-6 w-6 text-veno-primary" />
                  <span>Chat Bot</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-medium mb-4">Please Sign In</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to view your dashboard.
            </p>
            <Button 
              className="bg-veno-primary hover:bg-veno-primary/90"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
