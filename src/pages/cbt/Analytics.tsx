
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Users, Clock, Award } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Bar, 
  Line,
  CartesianGrid
} from "recharts";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

// Types for our data
type TestAttempt = {
  id: string;
  test_id: string;
  subject: string;
  score: number;
  total_questions: number;
  completed_at: string;
};

type TestSubject = {
  name: string;
  question_count: number;
};

type UserStats = {
  totalTests: number;
  testsCreated: number;
  studyHours: number;
  avgScore: number;
  subjects: {[key: string]: number};
  progressData: {month: string; tests: number; score: number}[];
};

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("performance");
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalTests: 0,
    testsCreated: 0,
    studyHours: 0,
    avgScore: 0,
    subjects: {},
    progressData: []
  });
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [subjects, setSubjects] = useState<TestSubject[]>([]);
  const [topUserTests, setTopUserTests] = useState<any[]>([]);

  // Helper to calculate performance data
  const calculatePerformanceData = () => {
    const subjectsPerformance = Object.entries(userStats.subjects).map(([name, count]) => {
      const subjectAttempts = testAttempts.filter(a => a.subject?.toLowerCase() === name.toLowerCase());
      const totalScore = subjectAttempts.reduce((sum, attempt) => 
        sum + (attempt.score / attempt.total_questions * 100), 0);
      const avgScore = subjectAttempts.length > 0 ? totalScore / subjectAttempts.length : 0;
      
      return {
        name,
        score: Math.round(avgScore),
        average: 70, // Average score across all users (would be fetched from backend in real app)
      };
    }).sort((a, b) => b.score - a.score).slice(0, 5);

    return subjectsPerformance;
  };

  // Helper to format date from timestamp
  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'short' });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      setIsLoading(true);
      try {
        // Fetch test attempts
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('test_attempts')
          .select('*')
          .eq('user_id', user.id);
          
        if (attemptsError) throw attemptsError;
        
        // Fetch user created tests
        const { data: testsData, error: testsError } = await supabase
          .from('user_tests')
          .select('*')
          .eq('creator_id', user.id);
          
        if (testsError) throw testsError;
        
        // Fetch subjects from database
        const { data: subjectsData, error: subjectsError } = await supabase
          .rpc('get_subjects_from_questions');
          
        if (subjectsError) throw subjectsError;
        
        // Fetch top tests by number of attempts 
        const { data: topTests, error: topTestsError } = await supabase
          .from('test_attempts')
          .select('test_id, count(*)')
          .group('test_id')
          .order('count', { ascending: false })
          .limit(5);
          
        if (topTestsError) throw topTestsError;
        
        // Calculate study hours (estimate based on test attempts)
        const studyHours = Math.round((attemptsData?.length || 0) * 0.5);
        
        // Calculate average score
        let totalScore = 0;
        let totalQuestions = 0;
        
        attemptsData?.forEach((attempt: any) => {
          totalScore += attempt.score || 0;
          totalQuestions += attempt.total_questions || 1;
        });
        
        const avgScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
        
        // Group attempts by subject
        const subjects: {[key: string]: number} = {};
        attemptsData?.forEach((attempt: any) => {
          if (attempt.subject) {
            subjects[attempt.subject] = (subjects[attempt.subject] || 0) + 1;
          }
        });
        
        // Create progress data over time
        const sortedAttempts = [...(attemptsData || [])].sort(
          (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
        );
        
        const progressData = [];
        
        if (sortedAttempts.length > 0) {
          const monthsMap: {[key: string]: {tests: number, totalScore: number, count: number}} = {};
          
          sortedAttempts.forEach((attempt: any) => {
            const month = formatMonth(attempt.completed_at);
            if (!monthsMap[month]) {
              monthsMap[month] = { tests: 0, totalScore: 0, count: 0 };
            }
            
            monthsMap[month].tests += 1;
            monthsMap[month].totalScore += (attempt.score / attempt.total_questions) * 100;
            monthsMap[month].count += 1;
          });
          
          Object.entries(monthsMap).forEach(([month, data]) => {
            progressData.push({
              month,
              tests: data.tests,
              score: Math.round(data.totalScore / data.count)
            });
          });
        }
        
        // If there's less than 6 months, add placeholder data
        while (progressData.length < 6) {
          const lastDate = progressData.length > 0 
            ? new Date(sortedAttempts[sortedAttempts.length - 1].completed_at)
            : new Date();
            
          lastDate.setMonth(lastDate.getMonth() + 1);
          progressData.push({
            month: formatMonth(lastDate.toISOString()),
            tests: 0,
            score: progressData.length > 0 ? progressData[progressData.length - 1].score : 0
          });
        }
        
        setTestAttempts(attemptsData || []);
        setSubjects(subjectsData || []);
        setTopUserTests(topTests || []);
        setUserStats({
          totalTests: attemptsData?.length || 0,
          testsCreated: testsData?.length || 0,
          studyHours,
          avgScore,
          subjects,
          progressData: progressData.slice(-6) // Get last 6 months
        });
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={`p-3 rounded-full bg-${color}-500/20`}>
            <Icon className={`h-5 w-5 text-${color}-500`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-veno-primary/30 border-t-veno-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  const performanceData = calculatePerformanceData();

  return (
    <div className="pb-6">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => navigate('/cbt')}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
      >
        <StatCard 
          title="Tests Taken" 
          value={userStats.totalTests.toString()} 
          icon={BarChart3} 
          color="blue"
        />
        <StatCard 
          title="Tests Created" 
          value={userStats.testsCreated.toString()} 
          icon={Users} 
          color="green"
        />
        <StatCard 
          title="Study Hours" 
          value={userStats.studyHours.toString()} 
          icon={Clock} 
          color="amber"
        />
        <StatCard 
          title="Average Score" 
          value={`${userStats.avgScore}%`} 
          icon={Award} 
          color="purple"
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Tabs defaultValue="performance" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>
                  Your scores across different subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {performanceData.length > 0 ? (
                    <ChartContainer
                      className="w-full"
                      config={{
                        yourScore: {
                          theme: {
                            light: "hsl(var(--veno-primary))",
                            dark: "hsl(var(--veno-primary))"
                          }
                        },
                        avgScore: {
                          theme: {
                            light: "hsl(var(--secondary))",
                            dark: "hsl(var(--secondary))"
                          }
                        }
                      }}
                    >
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="score" name="Your Score" fill="var(--color-yourScore)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="average" name="Average Score" fill="var(--color-avgScore)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Take tests to see your performance data</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between text-xs text-muted-foreground">
                <span>Data based on your test attempts</span>
                {performanceData.length > 0 && (
                  <Button variant="link" size="sm" className="text-xs p-0 h-auto">
                    View detailed breakdown
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Categories</CardTitle>
                  <CardDescription>
                    Your best performing test categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceData.length > 0 ? (
                    <ul className="space-y-4">
                      {performanceData.slice(0, 3).map((subject, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className={`w-2 h-8 ${
                              index === 0 ? 'bg-green-500' : 
                              index === 1 ? 'bg-blue-500' : 
                              'bg-yellow-500'
                            } rounded-sm mr-3`}></span>
                            <span>{subject.name}</span>
                          </div>
                          <span className="font-medium">{subject.score}%</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center justify-center h-[200px]">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Popular Subjects</CardTitle>
                  <CardDescription>
                    Most studied subjects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    {subjects.length > 0 ? (
                      <ChartContainer
                        className="w-full"
                        config={{
                          count: {
                            theme: {
                              light: "hsl(var(--veno-primary))",
                              dark: "hsl(var(--veno-primary))"
                            }
                          }
                        }}
                      >
                        <BarChart data={subjects.slice(0, 5)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="question_count" name="Questions" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Over Time</CardTitle>
                <CardDescription>
                  Your test scores and activity over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {userStats.progressData.length > 0 ? (
                    <ChartContainer
                      className="w-full"
                      config={{
                        score: {
                          theme: {
                            light: "hsl(var(--veno-primary))",
                            dark: "hsl(var(--veno-primary))"
                          }
                        },
                        tests: {
                          theme: {
                            light: "#82ca9d",
                            dark: "#82ca9d"
                          }
                        }
                      }}
                    >
                      <LineChart data={userStats.progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="var(--color-score)" />
                        <YAxis yAxisId="right" orientation="right" stroke="var(--color-tests)" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="score" 
                          stroke="var(--color-score)" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }} 
                          name="Avg Score (%)"
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="tests" 
                          stroke="var(--color-tests)" 
                          strokeWidth={2}
                          name="Tests Taken"
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Take tests to see your progress over time</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between text-xs text-muted-foreground">
                <span>Data from the last 6 months</span>
                {userStats.progressData.some(d => d.tests > 0) && (
                  <Button variant="link" size="sm" className="text-xs p-0 h-auto">
                    View all data
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Learning Time</CardTitle>
                <CardDescription>
                  Hours spent studying and taking tests
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-48 h-48 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-secondary"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-veno-primary"
                      strokeWidth="10"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 * (1 - (userStats.studyHours / 20))}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-3xl font-bold">{userStats.studyHours}h</div>
                    <div className="text-xs text-muted-foreground">of 20h goal</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="outline" size="sm">Set New Goal</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="achievements" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  id: 1,
                  title: "First Test",
                  description: "Complete your first test",
                  icon: "🏆",
                  achieved: userStats.totalTests > 0,
                  date: testAttempts.length > 0 ? testAttempts[0].completed_at : null,
                },
                {
                  id: 2,
                  title: "Perfect Score",
                  description: "Achieve a 100% score on a test",
                  icon: "⭐",
                  achieved: testAttempts.some(a => a.score === a.total_questions && a.total_questions > 0),
                  date: testAttempts.find(a => a.score === a.total_questions && a.total_questions > 0)?.completed_at,
                },
                {
                  id: 3,
                  title: "Test Creator",
                  description: "Create your first test",
                  icon: "🎓",
                  achieved: userStats.testsCreated > 0,
                  date: new Date().toISOString(),
                },
                {
                  id: 4,
                  title: "Quiz Master",
                  description: "Complete 10 different tests",
                  icon: "🧠",
                  achieved: userStats.totalTests >= 10,
                  progress: Math.min(userStats.totalTests, 10),
                  target: 10,
                },
                {
                  id: 5,
                  title: "Scholar",
                  description: "Study for a total of 20 hours",
                  icon: "📚",
                  achieved: userStats.studyHours >= 20,
                  progress: Math.min(userStats.studyHours, 20),
                  target: 20,
                },
              ].map((achievement) => (
                <Card key={achievement.id} className={achievement.achieved ? "border-veno-primary/30" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-medium">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                    
                    {achievement.achieved ? (
                      <div className="mt-4 text-xs text-veno-primary flex items-center">
                        <span className="mr-1">✓</span>
                        <span>
                          {achievement.date 
                            ? `Achieved on ${new Date(achievement.date).toLocaleDateString()}` 
                            : 'Achieved'}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>
                            {achievement.progress} / {achievement.target}
                          </span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full">
                          <div
                            className="bg-veno-primary h-2 rounded-full"
                            style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Analytics;
