
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Award, Medal, Share2, Trophy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LeaderboardUser {
  id: string;
  email: string;
  points: number;
  rank: number;
  referral_count: number;
}

interface LeaderboardSectionProps {
  userPoints: number;
}

const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ userPoints }) => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, points, user_id')
          .order('points', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Generate referral counts (in a real app, this would come from the database)
        const leaderboardWithRanks = data.map((user: any, index: number) => ({
          id: user.user_id,
          email: user.email || 'Anonymous User',
          points: user.points || 0,
          rank: index + 1,
          referral_count: Math.floor(Math.random() * 10) // Mock data
        }));
        
        setLeaderboard(leaderboardWithRanks);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Generate a referral code
    if (user) {
      setReferralCode(`${user.id.substring(0, 8)}`);
    }
  }, [user]);

  const copyReferralLink = () => {
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}/signup?ref=${referralCode}`;
    
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        toast.success("Referral link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy referral link");
      });
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">1st 🏆</Badge>;
    } else if (rank === 2) {
      return <Badge variant="default" className="bg-gray-400 hover:bg-gray-500">2nd 🥈</Badge>;
    } else if (rank === 3) {
      return <Badge variant="default" className="bg-amber-700 hover:bg-amber-800">3rd 🥉</Badge>;
    }
    return <Badge variant="outline">{rank}th</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Referral Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-primary/10 to-veno-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Refer Friends
            </CardTitle>
            <CardDescription>
              Invite friends to join Veno and earn 100 points for each successful referral
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 p-3 bg-background rounded border flex items-center justify-between">
                <span className="font-mono font-medium">{referralCode}</span>
                <Badge variant="outline">Your Code</Badge>
              </div>
              <Button 
                className="flex-none" 
                onClick={copyReferralLink}
              >
                <Share2 className="h-4 w-4 mr-2" /> Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" /> Top Referrers
          </CardTitle>
          <CardDescription>
            Users with the most successful referrals this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center items-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Referrals</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((leader) => (
                  <TableRow key={leader.id} className={leader.id === user?.id ? 'bg-primary/5' : ''}>
                    <TableCell>
                      {getRankBadge(leader.rank)}
                    </TableCell>
                    <TableCell className="font-medium flex items-center gap-2">
                      {leader.id === user?.id ? (
                        <span className="text-primary">{leader.email} (You)</span>
                      ) : (
                        leader.email
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {leader.referral_count}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {leader.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* How it Works Section */}
      <Card>
        <CardHeader>
          <CardTitle>How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Share your unique referral link with friends</li>
            <li>When they sign up using your link, you'll both earn 100 points</li>
            <li>There's no limit to how many friends you can refer</li>
            <li>Points can be redeemed for rewards in the Rewards tab</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardSection;
