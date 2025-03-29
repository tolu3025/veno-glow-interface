import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, User, BarChart2, Share2 } from 'lucide-react';
import { VenoLogo } from '@/components/ui/logo';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

type Test = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  time_limit: number | null;
  question_count: number;
  created_at: string;
  share_code: string;
  results_visibility: string;
  allow_retakes: boolean;
};

type TestAttempt = {
  id: string;
  participant_name: string;
  participant_email: string;
  score: number;
  total_questions: number;
  completed_at: string;
};

interface MyTestsSectionProps {
  onShare: (testId: string) => void;
}

const MyTestsSection: React.FC<MyTestsSectionProps> = ({ onShare }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  useEffect(() => {
    const fetchTests = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_tests')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTests(data || []);
      } catch (error) {
        console.error('Error fetching tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [user]);

  const fetchTestAttempts = async (testId: string) => {
    setAttemptsLoading(true);
    setSelectedTest(testId);
    
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('test_id', testId)
        .order('completed_at', { ascending: false });
        
      if (error) throw error;
      setTestAttempts(data || []);
    } catch (error) {
      console.error('Error fetching test attempts:', error);
      toast({
        title: "Error",
        description: "Failed to load test attempts",
        variant: "destructive",
      });
    } finally {
      setAttemptsLoading(false);
    }
  };

  const handleTakeTestClick = (testId: string) => {
    navigate(`/cbt/take/${testId}`);
  };

  const handleViewResultsClick = (testId: string) => {
    fetchTestAttempts(testId);
  };

  const closeResults = () => {
    setSelectedTest(null);
    setTestAttempts([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-veno-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <VenoLogo className="h-6 w-6" />
            <CardTitle>My Tests</CardTitle>
          </div>
          <CardDescription>Please sign in to view your tests</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-center text-muted-foreground mb-4">
            You need to be signed in to create and manage your tests
          </p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </CardContent>
      </Card>
    );
  }

  if (selectedTest) {
    const selectedTestData = tests.find(test => test.id === selectedTest);
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-veno-primary" />
              <CardTitle>{selectedTestData?.title || 'Test'} Results</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={closeResults}>
              Back to Tests
            </Button>
          </div>
          <CardDescription>
            Test attempts and participant scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attemptsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-veno-primary" />
            </div>
          ) : testAttempts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No attempts for this test yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testAttempts.map((attempt) => (
                <div key={attempt.id} className="bg-secondary/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-veno-primary" />
                      <span className="font-medium">{attempt.participant_name || 'Anonymous'}</span>
                    </div>
                    <div className="text-sm">
                      {attempt.score}/{attempt.total_questions} ({Math.round((attempt.score / attempt.total_questions) * 100)}%)
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>
                      {attempt.participant_email}
                    </span>
                    <span>
                      Completed: {formatDate(attempt.completed_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>My Tests</CardTitle>
        </div>
        <CardDescription>Manage your created tests</CardDescription>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">You haven't created any tests yet</p>
            <Button onClick={() => navigate("/cbt/create")}>Create Your First Test</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {tests.map((test) => (
              <div key={test.id} className="bg-secondary/30 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{test.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {test.description || 'No description'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onShare(test.id)}
                    className="text-veno-primary h-8 w-8"
                  >
                    <Share2 size={16} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                  <span className="bg-primary/10 px-2 py-1 rounded">
                    {test.question_count} Questions
                  </span>
                  <span className="bg-primary/10 px-2 py-1 rounded flex items-center">
                    <Clock className="mr-1 h-3 w-3" /> 
                    {test.time_limit || 'No'} min
                  </span>
                  <span className="bg-primary/10 px-2 py-1 rounded capitalize">
                    {test.difficulty}
                  </span>
                  <span className="bg-primary/10 px-2 py-1 rounded">
                    {test.allow_retakes ? 'Multiple attempts' : 'Single attempt'}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewResultsClick(test.id)}
                  >
                    View Results
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleTakeTestClick(test.id)}
                  >
                    Take Test
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyTestsSection;
