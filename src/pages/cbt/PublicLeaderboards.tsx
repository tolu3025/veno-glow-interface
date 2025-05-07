
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Search } from 'lucide-react';
import { toast } from 'sonner';
import LoadingState from '@/components/cbt/test/LoadingState';

interface PublicTest {
  id: string;
  title: string;
  subject: string;
  question_count: number;
  share_code: string;
  participants_count?: number;
}

const PublicLeaderboards = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [publicTests, setPublicTests] = useState<PublicTest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'code'>('name');

  useEffect(() => {
    fetchPublicTests();
  }, []);

  const fetchPublicTests = async () => {
    try {
      setLoading(true);
      
      // Fetch tests that have public results_visibility
      const { data: testsData, error: testsError } = await supabase
        .from('user_tests')
        .select('id, title, subject, question_count, share_code, results_visibility')
        .eq('results_visibility', 'public')
        .order('created_at', { ascending: false });
        
      if (testsError) {
        throw testsError;
      }
      
      if (!testsData || testsData.length === 0) {
        setPublicTests([]);
        setLoading(false);
        return;
      }
      
      // Get participant counts for each test
      const testIds = testsData.map(test => test.id);
      
      // Use a separate query to count attempts for each test
      const testsWithCounts = await Promise.all(testsData.map(async test => {
        const { count, error } = await supabase
          .from('test_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('test_id', test.id);
          
        if (error) {
          console.error('Error fetching count:', error);
          return {
            ...test,
            participants_count: 0
          };
        }
        
        return {
          ...test,
          participants_count: count || 0
        };
      }));
      
      setPublicTests(testsWithCounts);
    } catch (error) {
      console.error('Error fetching public tests:', error);
      toast.error('Failed to load public tests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    
    if (searchType === 'code') {
      // If searching by share code, navigate directly to that test's leaderboard
      const test = publicTests.find(t => 
        t.share_code?.toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (test) {
        navigate(`/cbt/leaderboard/${test.id}`);
      } else {
        toast.error('No test found with that share code');
      }
    }
  };

  const filteredTests = publicTests.filter(test => {
    if (searchTerm === '') return true;
    
    if (searchType === 'name') {
      return test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             test.subject.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  });

  const viewLeaderboard = (testId: string) => {
    navigate(`/cbt/leaderboard/${testId}`);
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <CardTitle>Public Leaderboards</CardTitle>
          </div>
          <CardDescription>
            View rankings and scores for public tests
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchType === 'name' ? "Search by test name or subject..." : "Enter test share code..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={searchType === 'name' ? 'default' : 'outline'} 
                onClick={() => setSearchType('name')}
                className="whitespace-nowrap"
              >
                Search by Name
              </Button>
              <Button
                variant={searchType === 'code' ? 'default' : 'outline'}
                onClick={() => setSearchType('code')}
                className="whitespace-nowrap"
              >
                Search by Code
              </Button>
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {filteredTests.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No public tests found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try a different search term or clear the search" : "There are no public tests available at the moment"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden md:table-cell">Questions</TableHead>
                    <TableHead className="hidden md:table-cell">Participants</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">{test.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {test.subject}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{test.question_count}</TableCell>
                      <TableCell className="hidden md:table-cell">{test.participants_count || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => viewLeaderboard(test.id)}
                        >
                          View Leaderboard
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Separator />
          <div className="text-center w-full">
            <p className="text-sm text-muted-foreground mb-2">
              If you have a test share code, you can enter it above to view its leaderboard.
            </p>
            <Button variant="outline" onClick={() => navigate('/cbt')}>
              Back to Tests
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PublicLeaderboards;
