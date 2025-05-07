
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Search, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import LoadingState from '@/components/cbt/test/LoadingState';
import { playSound } from '@/utils/soundEffects';

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
    playSound('click');
    
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
    playSound('click');
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
          {/* Search Bar - Restructured for mobile responsiveness */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchType === 'name' ? "Search by test name or subject..." : "Enter test share code..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={searchType === 'name' ? 'default' : 'outline'} 
                onClick={() => setSearchType('name')}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                By Name
              </Button>
              <Button
                variant={searchType === 'code' ? 'default' : 'outline'}
                onClick={() => setSearchType('code')}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                By Code
              </Button>
              <Button 
                onClick={handleSearch}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Search
              </Button>
            </div>
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
                    <TableHead className="hidden sm:table-cell">Subject</TableHead>
                    <TableHead className="hidden md:table-cell">Questions</TableHead>
                    <TableHead className="hidden md:table-cell">Participants</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">
                        <div className="truncate max-w-[150px] sm:max-w-none">
                          {test.title}
                        </div>
                        <div className="sm:hidden">
                          <Badge variant="outline" className="mt-1 capitalize">
                            {test.subject}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
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
                          className="whitespace-nowrap"
                        >
                          <span className="hidden sm:inline">View Leaderboard</span>
                          <span className="sm:hidden">View</span>
                          <ArrowRight className="ml-1 h-4 w-4" />
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
            <Button variant="outline" onClick={() => {
              playSound('click');
              navigate('/cbt');
            }}>
              Back to Tests
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PublicLeaderboards;
