import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VenoLogo } from '@/components/ui/logo';
import { Trophy, ArrowLeft, Clock, Medal, Users, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import LoadingState from '@/components/cbt/test/LoadingState';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { playSound } from '@/utils/soundEffects';

interface TestAttempt {
  id: string;
  participant_name: string;
  participant_email: string;
  score: number;
  total_questions: number;
  time_taken: number | null;
  completed_at: string;
  disqualified: boolean;
}

interface TestDetails {
  id: string;
  title: string;
  creator_id: string;
  question_count: number;
  results_visibility: string;
}

const Leaderboard = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<TestAttempt[]>([]);
  const [userAccessError, setUserAccessError] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!testId) {
        toast.error('Invalid test ID');
        navigate('/cbt');
        return;
      }

      try {
        setLoading(true);
        
        // Fetch test details
        const { data: testData, error: testError } = await supabase
          .from('user_tests')
          .select('*')
          .eq('id', testId)
          .single();
          
        if (testError) {
          console.error('Error fetching test details:', testError);
          toast.error('Failed to load test details');
          return;
        }
        
        if (!testData) {
          toast.error('Test not found');
          navigate('/cbt');
          return;
        }
        
        setTestDetails(testData);
        console.log('Test details loaded:', testData);
        
        // Check if results are public or user is the creator
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData?.user;
        
        if (testData.results_visibility !== 'public' && testData.creator_id !== currentUser?.id) {
          setUserAccessError(true);
          setLoading(false);
          return;
        }
        
        // Fetch leaderboard data with profile information
        const { data, error } = await supabase
          .from('test_attempts')
          .select(`
            *,
            profiles(display_name, email)
          `)
          .eq('test_id', testId)
          .order('score', { ascending: false })
          .order('completed_at', { ascending: true });
          
        if (error) {
          console.error('Error fetching leaderboard data:', error);
          toast.error('Failed to load leaderboard data');
          return;
        }
        
        // Transform the data to include proper names
        const transformedLeaderboard: TestAttempt[] = (data || []).map(attempt => ({
          id: attempt.id,
          participant_name: attempt.profiles?.display_name || attempt.participant_name || 'Anonymous',
          participant_email: attempt.participant_email || attempt.profiles?.email || '',
          score: attempt.score,
          total_questions: attempt.total_questions,
          time_taken: attempt.time_taken,
          completed_at: attempt.completed_at || new Date().toISOString(),
          disqualified: attempt.disqualified || false
        }));
        
        console.log('Leaderboard data loaded:', transformedLeaderboard);
        setLeaderboard(transformedLeaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [testId, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleButtonClick = (destination: string | number) => {
    playSound('click');
    if (typeof destination === 'string') {
      navigate(destination);
    } else {
      navigate(destination);
    }
  };

  if (loading) {
    return <LoadingState />;
  }
  
  if (userAccessError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VenoLogo className="h-6 w-6" />
                <CardTitle>Access Denied</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => handleButtonClick(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            <CardDescription>
              You don't have permission to view this leaderboard
            </CardDescription>
          </CardHeader>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              This leaderboard is only visible to the test creator
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => handleButtonClick('/cbt')}>
                Go to Tests
              </Button>
              <Button variant="outline" onClick={() => handleButtonClick('/cbt/public-leaderboards')}>
                View Public Leaderboards
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <VenoLogo className="h-6 w-6" />
              <CardTitle>Leaderboard</CardTitle>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleButtonClick('/cbt/public-leaderboards')}
                className="flex items-center gap-1"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">All Leaderboards</span>
                <span className="sm:hidden">All</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => handleButtonClick(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
          {testDetails && (
            <CardDescription>
              {testDetails.title} | {leaderboard.length} participants
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No participants yet</h3>
              <p className="text-muted-foreground">Be the first to take this test and appear on the leaderboard!</p>
            </div>
          ) : (
            <div>
              {/* Top 3 performers highlight */}
              {leaderboard.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {/* 2nd place */}
                  <div className="bg-secondary/30 rounded-lg p-4 text-center order-2 md:order-1">
                    <div className="flex justify-center mb-2">
                      <div className="bg-secondary/50 rounded-full p-3">
                        <Medal className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                    <Badge className="mb-1 bg-blue-500">2nd Place</Badge>
                    <div className="flex justify-center mb-1">
                      <Avatar className="h-12 w-12 mb-1">
                        <AvatarFallback>
                          {leaderboard[1]?.participant_name?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <h3 className="font-medium text-sm truncate">
                      {leaderboard[1]?.participant_name || "Anonymous"}
                    </h3>
                    <p className="text-2xl font-bold">
                      {Math.round((leaderboard[1]?.score / leaderboard[1]?.total_questions) * 100)}%
                    </p>
                  </div>

                  {/* 1st place */}
                  <div className="bg-secondary/30 rounded-lg p-4 text-center order-1 md:order-2 ring-2 ring-primary/20">
                    <div className="flex justify-center mb-2">
                      <div className="bg-primary/20 rounded-full p-3">
                        <Trophy className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <Badge className="mb-1 bg-primary">1st Place</Badge>
                    <div className="flex justify-center mb-1">
                      <Avatar className="h-14 w-14 mb-1">
                        <AvatarFallback>
                          {leaderboard[0]?.participant_name?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <h3 className="font-medium truncate">
                      {leaderboard[0]?.participant_name || "Anonymous"}
                    </h3>
                    <p className="text-3xl font-bold">
                      {Math.round((leaderboard[0]?.score / leaderboard[0]?.total_questions) * 100)}%
                    </p>
                  </div>

                  {/* 3rd place */}
                  <div className="bg-secondary/30 rounded-lg p-4 text-center order-3">
                    <div className="flex justify-center mb-2">
                      <div className="bg-secondary/50 rounded-full p-3">
                        <Medal className="h-6 w-6 text-amber-500" />
                      </div>
                    </div>
                    <Badge className="mb-1 bg-amber-500">3rd Place</Badge>
                    <div className="flex justify-center mb-1">
                      <Avatar className="h-12 w-12 mb-1">
                        <AvatarFallback>
                          {leaderboard[2]?.participant_name?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <h3 className="font-medium text-sm truncate">
                      {leaderboard[2]?.participant_name || "Anonymous"}
                    </h3>
                    <p className="text-2xl font-bold">
                      {Math.round((leaderboard[2]?.score / leaderboard[2]?.total_questions) * 100)}%
                    </p>
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              {/* Full Leaderboard */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Time</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, index) => (
                      <TableRow key={entry.id} className={entry.disqualified ? "bg-destructive/10" : ""}>
                        <TableCell className="font-medium">
                          {index + 1}
                          {index === 0 && " 🥇"}
                          {index === 1 && " 🥈"}
                          {index === 2 && " 🥉"}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {entry.participant_name?.[0]?.toUpperCase() || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{entry.participant_name || "Anonymous"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {Math.round((entry.score / entry.total_questions) * 100)}%
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {entry.time_taken ? formatTime(entry.time_taken) : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                          {new Date(entry.completed_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-center gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => handleButtonClick('/cbt')}
          >
            Back to Tests
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => handleButtonClick('/cbt/public-leaderboards')}
          >
            View All Leaderboards
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Leaderboard;
