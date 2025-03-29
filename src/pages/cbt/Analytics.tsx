import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Users, Clock, Award, CheckCircle } from "lucide-react";
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

const performanceData = [
  { name: 'JavaScript', score: 85, average: 72 },
  { name: 'React', score: 76, average: 69 },
  { name: 'HTML/CSS', score: 92, average: 78 },
  { name: 'Python', score: 65, average: 70 },
  { name: 'Node.js', score: 78, average: 64 },
];

const progressData = [
  { month: 'Jan', tests: 5, score: 68 },
  { month: 'Feb', tests: 7, score: 72 },
  { month: 'Mar', tests: 10, score: 75 },
  { month: 'Apr', tests: 12, score: 79 },
  { month: 'May', tests: 8, score: 82 },
  { month: 'Jun', tests: 14, score: 85 },
];

const testCompletionData = [
  { name: 'JavaScript Quiz', completions: 45 },
  { name: 'React Fundamentals', completions: 32 },
  { name: 'Web Dev Basics', completions: 54 },
  { name: 'Programming Logic', completions: 26 },
  { name: 'Data Structures', completions: 18 },
];

const achievements = [
  {
    id: 1,
    title: "First Test",
    description: "Complete your first test",
    icon: "🏆",
    achieved: true,
    date: "2023-07-15",
  },
  {
    id: 2,
    title: "Perfect Score",
    description: "Achieve a 100% score on a test",
    icon: "⭐",
    achieved: true,
    date: "2023-08-22",
  },
  {
    id: 3,
    title: "Test Creator",
    description: "Create your first test",
    icon: "🎓",
    achieved: true,
    date: "2023-09-10",
  },
  {
    id: 4,
    title: "Quiz Master",
    description: "Complete 10 different tests",
    icon: "🧠",
    achieved: false,
    progress: 7,
    target: 10,
  },
  {
    id: 5,
    title: "Scholar",
    description: "Study for a total of 20 hours",
    icon: "📚",
    achieved: false,
    progress: 14,
    target: 20,
  },
];

const Analytics = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("performance");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

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
          value="32" 
          icon={BarChart3} 
          color="blue"
        />
        <StatCard 
          title="Tests Created" 
          value="5" 
          icon={Users} 
          color="green"
        />
        <StatCard 
          title="Study Hours" 
          value="14" 
          icon={Clock} 
          color="amber"
        />
        <StatCard 
          title="Average Score" 
          value="78%" 
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
                <CardTitle>Test Performance</CardTitle>
                <CardDescription>
                  Your scores compared to average user scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="score" name="Your Score" fill="var(--veno-primary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="average" name="Average Score" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between text-xs text-muted-foreground">
                <span>Data based on your last attempts</span>
                <Button variant="link" size="sm" className="text-xs p-0 h-auto">
                  View detailed breakdown
                </Button>
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
                  <ul className="space-y-4">
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-2 h-8 bg-green-500 rounded-sm mr-3"></span>
                        <span>HTML/CSS</span>
                      </div>
                      <span className="font-medium">92%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-2 h-8 bg-blue-500 rounded-sm mr-3"></span>
                        <span>JavaScript</span>
                      </div>
                      <span className="font-medium">85%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-2 h-8 bg-yellow-500 rounded-sm mr-3"></span>
                        <span>Node.js</span>
                      </div>
                      <span className="font-medium">78%</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Popular Tests</CardTitle>
                  <CardDescription>
                    Most taken tests by all users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={testCompletionData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                          }} 
                        />
                        <Bar dataKey="completions" fill="var(--veno-primary)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
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
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" orientation="left" stroke="var(--veno-primary)" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }} 
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="score" 
                        stroke="var(--veno-primary)" 
                        strokeWidth={2}
                        activeDot={{ r: 8 }} 
                        name="Avg Score (%)"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="tests" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="Tests Taken"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between text-xs text-muted-foreground">
                <span>Data from January to June 2023</span>
                <Button variant="link" size="sm" className="text-xs p-0 h-auto">
                  View all data
                </Button>
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
                      strokeDashoffset={251.2 * 0.3}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-3xl font-bold">14h</div>
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
              {achievements.map((achievement) => (
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
                        <CheckCircle size={14} className="mr-1" />
                        <span>Achieved on {new Date(achievement.date).toLocaleDateString()}</span>
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
