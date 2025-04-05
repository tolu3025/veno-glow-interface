import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Trophy, Clock, PieChartIcon, ArrowUp, BookOpen, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import AppNavigation from "@/components/cbt/AppNavigation";

// Define a type for test attempts
type TestAttempt = {
  id: string;
  score: number;
  total_questions: number;
  time_taken: number;
  completed_at: string;
  test_id: string;
  user_id: string | null;
  subject: string;
  title: string;
};

// Define a type for top tests
type TopTest = {
  test_id: string;
  count: number;
  title?: string;  // Optional title from user_tests
};

// Define colors for charts
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

const AnalyticsPage = () => {
  const [topTests, setTopTests] = useState<TopTest[]>([]);
  const [userTestAttempts, setUserTestAttempts] = useState<TestAttempt[]>([]);
  const [subjectDistribution, setSubjectDistribution] = useState<{ name: string, value: number }[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuizzes, setTotalQuizzes] = useState(0);

  // Setup realtime subscription
  useEffect(() => {
    setIsLoading(true);
    
    const fetchData = async () => {
      await Promise.all([
        fetchTopTests(),
        fetchUserTestAttempts(),
        fetchSubjectDistribution(),
        fetchTotalQuizzes()
      ]);
      setIsLoading(false);
    };
    
    fetchData();
    
    // Set up realtime subscription to test_attempts table
    const channel = supabase
      .channel('analytics-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'test_attempts' },
        () => {
          // Refresh data when changes happen
          fetchUserTestAttempts();
          fetchTopTests();
          fetchSubjectDistribution();
          fetchTotalQuizzes();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTotalQuizzes = async () => {
    try {
      const { count, error } = await supabase
        .from('test_attempts')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error fetching total quizzes:', error);
        return;
      }
      
      setTotalQuizzes(count || 0);
    } catch (error) {
      console.error('Error in total quizzes workflow:', error);
    }
  };

  const fetchTopTests = async () => {
    try {
      // Fetch top tests using the RPC function
      const { data: topTestsData, error: topTestsError } = await supabase
        .rpc('get_top_tests', { limit_count: 5 });
      
      if (topTestsError) {
        console.error('Error fetching top tests:', topTestsError);
        return;
      }
      
      // Now fetch titles for these tests
      if (topTestsData) {
        const testIds = topTestsData.map(test => test.test_id);
        
        const { data: testTitles, error: testTitlesError } = await supabase
          .from('user_tests')
          .select('id, title')
          .in('id', testIds);
          
        if (testTitlesError) {
          console.error('Error fetching test titles:', testTitlesError);
        }
        
        // Combine the data
        const enrichedTopTests = topTestsData.map(test => {
          const matchingTest = testTitles?.find(t => t.id === test.test_id);
          return {
            test_id: test.test_id,
            count: test.count,
            title: matchingTest?.title || 'Unnamed Test'
          };
        });
        
        setTopTests(enrichedTopTests);
      }
    } catch (error) {
      console.error('Error in top tests workflow:', error);
    }
  };

  const fetchUserTestAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select(`
          id, 
          score, 
          total_questions, 
          time_taken, 
          completed_at, 
          test_id,
          user_id,
          user_tests(title, subject)
        `)
        .order('completed_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching test attempts:', error);
        return;
      }
      
      if (data) {
        // Transform data to match TestAttempt type
        const transformedData: TestAttempt[] = data.map(attempt => ({
          id: attempt.id,
          score: attempt.score,
          total_questions: attempt.total_questions,
          time_taken: attempt.time_taken,
          completed_at: attempt.completed_at,
          test_id: attempt.test_id,
          user_id: attempt.user_id,
          subject: attempt.user_tests?.subject || 'Unknown',
          title: attempt.user_tests?.title || 'Unnamed Test'
        }));
        
        setUserTestAttempts(transformedData);
      }
    } catch (error) {
      console.error('Error in test attempts workflow:', error);
    }
  };
  
  const fetchSubjectDistribution = async () => {
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select(`
          user_tests(subject)
        `);
      
      if (error) {
        console.error('Error fetching subject distribution:', error);
        return;
      }
      
      if (data) {
        // Count subjects
        const subjectCounts: Record<string, number> = {};
        data.forEach(attempt => {
          const subject = attempt.user_tests?.subject || 'Unknown';
          subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        });
        
        // Convert to array format for chart
        const subjectData = Object.entries(subjectCounts).map(([name, value]) => ({
          name,
          value
        }));
        
        setSubjectDistribution(subjectData);
      }
    } catch (error) {
      console.error('Error in subject distribution workflow:', error);
    }
  };

  // Calculate average score
  const averageScore = userTestAttempts.length > 0 
    ? Math.round(userTestAttempts.reduce((sum, attempt) => sum + (attempt.score / attempt.total_questions * 100), 0) / userTestAttempts.length) 
    : 0;

  // Format time for display (convert seconds to minutes:seconds)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Prepare trend data (last 5 attempts)
  const trendData = [...userTestAttempts]
    .slice(0, 5)
    .reverse()
    .map(attempt => ({
      name: attempt.title.substring(0, 15) + (attempt.title.length > 15 ? '...' : ''),
      score: Math.round((attempt.score / attempt.total_questions) * 100)
    }));
  
  // Animation variants for framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="pb-20 md:pb-6 md:pl-64">
      <AppNavigation />
      
      <div className="flex items-center mb-6">
        <BarChart3 className="h-6 w-6 mr-2 text-veno-primary" />
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            Overview
          </TabsTrigger>
          <TabsTrigger value="tests" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            Test Analysis
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            Performance Trends
          </TabsTrigger>
        </TabsList>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background border-veno-primary/20">
                  <CardContent className="p-6 flex items-center">
                    <div className="bg-veno-primary/10 p-3 rounded-full mr-4">
                      <Trophy className="h-8 w-8 text-veno-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <h3 className="text-2xl font-bold">{averageScore}%</h3>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-background border-veno-primary/20">
                  <CardContent className="p-6 flex items-center">
                    <div className="bg-veno-primary/10 p-3 rounded-full mr-4">
                      <BookOpen className="h-8 w-8 text-veno-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tests Taken</p>
                      <h3 className="text-2xl font-bold">{userTestAttempts.length}</h3>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-background border-veno-primary/20">
                  <CardContent className="p-6 flex items-center">
                    <div className="bg-veno-primary/10 p-3 rounded-full mr-4">
                      <ArrowUp className="h-8 w-8 text-veno-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Highest Score</p>
                      <h3 className="text-2xl font-bold">
                        {userTestAttempts.length > 0 
                          ? Math.max(...userTestAttempts.map(a => Math.round((a.score / a.total_questions) * 100))) 
                          : 0}%
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-background border-veno-primary/20">
                  <CardContent className="p-6 flex items-center">
                    <div className="bg-veno-primary/10 p-3 rounded-full mr-4">
                      <Clock className="h-8 w-8 text-veno-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Time</p>
                      <h3 className="text-2xl font-bold">
                        {userTestAttempts.length > 0 
                          ? formatTime(Math.round(userTestAttempts.reduce((sum, a) => sum + a.time_taken, 0) / userTestAttempts.length))
                          : '0:00'}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            
            {/* Total Quizzes Card */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-background border-veno-primary/20">
                <CardContent className="p-6 flex items-center">
                  <div className="bg-veno-primary/10 p-3 rounded-full mr-4">
                    <Calendar className="h-8 w-8 text-veno-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Quizzes Completed</p>
                    <h3 className="text-2xl font-bold">{totalQuizzes}</h3>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Charts Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-veno-primary" />
                      Subject Distribution
                    </CardTitle>
                    <CardDescription>Tests completed by subject area</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {subjectDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={subjectDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {subjectDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} tests`, 'Count']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-veno-primary" />
                      Recent Performance
                    </CardTitle>
                    <CardDescription>Your last 5 test scores</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No recent test data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="tests">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top 5 Most Taken Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topTests.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Test Title</TableHead>
                          <TableHead>Times Taken</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topTests.map((test, index) => (
                          <TableRow key={test.test_id}>
                            <TableCell>
                              <Badge variant="outline" className="bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-yellow-200">
                                #{index + 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{test.title}</TableCell>
                            <TableCell>{test.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No data available for top tests</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="trends">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Your Test History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userTestAttempts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Test</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Time Taken</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userTestAttempts.map((attempt) => {
                            const scorePercent = Math.round((attempt.score / attempt.total_questions) * 100);
                            return (
                              <TableRow key={attempt.id}>
                                <TableCell className="font-medium">{attempt.title}</TableCell>
                                <TableCell>{attempt.subject}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={`${
                                      scorePercent >= 70 ? 'bg-green-100 text-green-800 border-green-200' :
                                      scorePercent >= 50 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                      'bg-red-100 text-red-800 border-red-200'
                                    }`}
                                  >
                                    {scorePercent}%
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatTime(attempt.time_taken)}</TableCell>
                                <TableCell>{new Date(attempt.completed_at).toLocaleDateString()}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No test attempts recorded</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
