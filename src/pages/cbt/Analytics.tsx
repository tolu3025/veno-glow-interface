import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Trophy, Clock } from 'lucide-react';

// Define a type for top tests
type TopTest = {
  test_id: string;
  count: number;
  title?: string;  // Optional title from user_tests
};

const AnalyticsPage = () => {
  const [topTests, setTopTests] = useState<TopTest[]>([]);
  const [userTestAttempts, setUserTestAttempts] = useState<any[]>([]);

  useEffect(() => {
    const fetchTopTests = async () => {
      try {
        // Fetch top tests using the new RPC function
        const { data: topTestsData, error: topTestsError } = await supabase
          .rpc('get_top_tests', { limit_count: 5 })
          .select('test_id, count, user_tests(title)');
        
        if (topTestsError) throw topTestsError;
        
        if (topTestsData) {
          // Map the data to include test titles
          const enrichedTopTests = topTestsData.map(test => ({
            test_id: test.test_id,
            count: test.count,
            title: test.user_tests?.title || 'Unnamed Test'
          }));
          
          setTopTests(enrichedTopTests);
        }
      } catch (error) {
        console.error('Error fetching top tests:', error);
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
            user_tests(title, subject)
          `);
        
        if (error) throw error;
        
        if (data) {
          // Transform data to match TestAttempt type
          const transformedData = data.map(attempt => ({
            ...attempt,
            subject: attempt.user_tests?.subject || 'Unknown',
            title: attempt.user_tests?.title || 'Unnamed Test'
          }));
          
          setUserTestAttempts(transformedData);
        }
      } catch (error) {
        console.error('Error fetching test attempts:', error);
      }
    };

    fetchTopTests();
    fetchUserTestAttempts();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>

      {/* Top Tests Section */}
      <Card className="mb-8">
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
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{test.title}</TableCell>
                    <TableCell>{test.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No data available for top tests.</p>
          )}
        </CardContent>
      </Card>

      {/* User Test Attempts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Your Recent Test Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userTestAttempts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userTestAttempts}>
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No test attempts recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
