import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Trophy, Award, UserCheck, Share2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';

interface LeaderboardSectionProps {
  userPoints: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  referrals: number;
  isCurrentUser: boolean;
}

interface ReferralCount {
  referrer_id: string;
  count: number;
}

const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ userPoints }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profiles ordered by points (descending)
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, points')
          .order('points', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        
        // Fetch user referrals to count them - fixed query to avoid using group()
        const { data: referralsData, error: referralsError } = await supabase
          .from('user_referrals')
          .select('referrer_id, status');
          
        if (referralsError) throw referralsError;
        
        // Process the referrals manually
        const referralCounts: Record<string, number> = {};
        if (referralsData) {
          referralsData.forEach((item: any) => {
            if (item.status === 'completed' && item.referrer_id) {
              if (!referralCounts[item.referrer_id]) {
                referralCounts[item.referrer_id] = 0;
              }
              referralCounts[item.referrer_id]++;
            }
          });
        }
        
        // Transform the data
        const leaderboard: LeaderboardEntry[] = data.map((profile: any, index: number) => {
          const isCurrentUser = profile.id === user.id;
          const name = profile.email.split('@')[0]; // Use email username as display name
          
          // If this is current user, set their rank
          if (isCurrentUser) {
            setUserRank(index + 1);
          }
          
          return {
            id: profile.id,
            name,
            points: profile.points || 0,
            referrals: referralCounts[profile.id] || 0,
            isCurrentUser
          };
        });
        
        setLeaderboardData(leaderboard);
        
        // If user is not in top 10, find their rank
        if (!leaderboard.some(entry => entry.isCurrentUser) && user) {
          const { data: allProfiles, error: countError } = await supabase
            .from('user_profiles')
            .select('id')
            .gte('points', userPoints)
            .order('points', { ascending: false });
            
          if (!countError && allProfiles) {
            // The rank is the number of users with more points + 1
            setUserRank(allProfiles.length);
          }
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Set up realtime subscription for leaderboard updates
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        () => fetchLeaderboard()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userPoints]);

  const handleReferralLink = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to sign in to generate a referral link",
        variant: "destructive",
      });
      return;
    }

    // Generate a unique referral code
    const referralCode = `${user.id.slice(0, 8)}`;
    const baseUrl = window.location.origin;
    const generatedLink = `${baseUrl}/signup?ref=${referralCode}`;
    
    setReferralLink(generatedLink);
    setShowReferralDialog(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied to clipboard!",
      description: "Your referral link has been copied to the clipboard",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16 mt-1" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16 mt-1" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>

        <div className="rounded-lg border">
          <div className="p-4 border-b">
            <Skeleton className="h-6 w-36" />
          </div>
          
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Your Leaderboard Position</CardTitle>
          <CardDescription>Invite more friends to climb the ranks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Your Rank</p>
                <p className="text-2xl font-bold">
                  {userRank ? `#${userRank}` : 'Not ranked yet'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Your Points</p>
              <p className="text-2xl font-bold">{userPoints}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={handleReferralLink}>
            <Share2 className="h-4 w-4 mr-2" />
            Refer A Friend
          </Button>
        </CardFooter>
      </Card>

      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Top Points Leaderboard</h3>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Referrals</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.length > 0 ? (
                leaderboardData.map((user, index) => (
                  <TableRow key={user.id} className={user.isCurrentUser ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        {index === 1 && (
                          <Trophy className="h-4 w-4 text-gray-400" />
                        )}
                        {index === 2 && (
                          <Award className="h-4 w-4 text-amber-700" />
                        )}
                        #{index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.name}
                      {user.isCurrentUser && (
                        <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{user.referrals}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{user.points}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No leaderboard data available yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Referral Link</DialogTitle>
            <DialogDescription>
              Share this link with your friends. When they sign up, you'll earn 100 points!
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="flex-1"
            />
            <Button onClick={copyToClipboard}>
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReferralDialog(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaderboardSection;
