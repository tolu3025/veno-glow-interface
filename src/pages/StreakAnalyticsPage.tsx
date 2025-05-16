
import React from "react";
import { useStreak } from "@/providers/StreakProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Calendar, Trophy, Flame, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { StreakCalendar } from "@/components/streak/StreakCalendar";
import { StreakAchievements } from "@/components/streak/StreakAchievements";
import { Separator } from "@/components/ui/separator";

const StreakAnalyticsPage = () => {
  const { streak, getStreakMessage } = useStreak();
  const navigate = useNavigate();
  
  // Calculate percentage to next unlock
  const nextCertLevel = [50, 100, 200, 500, 1000].find(level => level > streak.points) || 1000;
  const prevCertLevel = [0, 50, 100, 200, 500].find((_, i, arr) => arr[i + 1] > streak.points) || 0;
  const progressPercentage = ((streak.points - prevCertLevel) / (nextCertLevel - prevCertLevel)) * 100;

  // Next milestone information
  const nextMilestone = {
    points: nextCertLevel,
    name: nextCertLevel === 50 ? "Basic Certification" :
          nextCertLevel === 100 ? "Intermediate Certification" :
          nextCertLevel === 200 ? "Advanced Certification" :
          nextCertLevel === 500 ? "Expert Certification" : "Master Certification"
  };
  
  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Streak Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your learning progress and achievements</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4 md:mt-0">
          <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
          Back
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flame className="h-6 w-6 mr-2 text-orange-500" />
              Current Streak
            </CardTitle>
            <CardDescription>Your continuous learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-5xl font-bold mb-2 flex items-center justify-center">
                <Flame className="h-8 w-8 mr-2 text-orange-500" />
                {streak.currentStreak}
                <span className="text-lg font-normal ml-2">days</span>
              </div>
              <p className="text-muted-foreground">{getStreakMessage()}</p>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2">
              <div className="text-center">
                <div className="text-muted-foreground text-sm">Total Points</div>
                <div className="text-2xl font-semibold flex items-center justify-center">
                  <Trophy className="h-5 w-5 mr-1 text-blue-500" />
                  {streak.points}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-muted-foreground text-sm">Pages Visited</div>
                <div className="text-2xl font-semibold">
                  {streak.visitedPages.size}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-muted-foreground text-sm">Videos Watched</div>
                <div className="text-2xl font-semibold">
                  {streak.watchedVideos.size}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-muted-foreground text-sm">Courses Unlocked</div>
                <div className="text-2xl font-semibold flex items-center justify-center">
                  <Award className="h-5 w-5 mr-1 text-violet-500" />
                  {streak.unlockedCourses.size}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-6 w-6 mr-2 text-indigo-500" />
              Streak Calendar
            </CardTitle>
            <CardDescription>Your activity in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <StreakCalendar />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-blue-500" />
              Next Milestone
            </CardTitle>
            <CardDescription>
              {nextMilestone.points - streak.points} points needed for {nextMilestone.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{prevCertLevel} points</span>
                <span>{nextCertLevel} points</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">Your progress:</div>
                <div className="text-sm font-medium">
                  {streak.points} / {nextMilestone.points} points ({Math.round(progressPercentage)}%)
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/')}>
                Continue Learning
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-6 w-6 mr-2 text-violet-500" />
              Your Achievements
            </CardTitle>
            <CardDescription>Certifications and milestones you've reached</CardDescription>
          </CardHeader>
          <CardContent>
            <StreakAchievements />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StreakAnalyticsPage;
