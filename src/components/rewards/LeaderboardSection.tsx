
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Trophy, Award, UserCheck } from "lucide-react";
import { Button } from '@/components/ui/button';

interface LeaderboardSectionProps {
  userPoints: number;
}

const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ userPoints }) => {
  // Mock data for leaderboard
  const leaderboardData = [
    { id: 1, name: 'Alex Johnson', points: 750, referrals: 5 },
    { id: 2, name: 'Jamie Smith', points: 620, referrals: 4 },
    { id: 3, name: 'Taylor Brown', points: 580, referrals: 3 },
    { id: 4, name: 'Jordan Williams', points: 450, referrals: 2 },
    { id: 5, name: 'Casey Davis', points: 320, referrals: 2 },
    { id: 6, name: 'Morgan Wilson', points: 280, referrals: 1 },
    { id: 7, name: 'Riley Moore', points: 210, referrals: 1 },
    { id: 8, name: 'Quinn Thomas', points: 180, referrals: 1 },
    { id: 9, name: 'Avery Martin', points: 150, referrals: 1 },
    { id: 10, name: 'Dakota Lee', points: 120, referrals: 1 },
  ];

  // Finding user rank - in a real app this would come from the backend
  const userRank = userPoints > 0 ? 
    leaderboardData.findIndex(user => userPoints >= user.points) + 1 : 
    leaderboardData.length + 1;

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
                  {userRank <= 10 ? `#${userRank}` : 'Not in top 10'}
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
          <Button variant="outline" className="w-full">
            Refer A Friend
          </Button>
        </CardFooter>
      </Card>

      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Top Referrers</h3>
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
              {leaderboardData.map((user, index) => (
                <TableRow key={user.id}>
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
                  <TableCell>{user.name}</TableCell>
                  <TableCell className="text-right">{user.referrals}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{user.points}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardSection;
