
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Trophy, Award, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VenoLogo } from "@/components/ui/logo";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import Certificate from "@/components/certificate/Certificate";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface StreakData {
  currentStreak: number;
  lastInteraction: string;
  longestStreak: number;
  streakStartDate: string;
}

interface StreakMilestone {
  days: number;
  title: string;
  description: string;
  achieved: boolean;
  certificateType: "bronze" | "silver" | "gold" | "platinum";
}

const StreakPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<StreakMilestone | null>(null);
  
  // Define streak milestones
  const milestones: StreakMilestone[] = [
    { 
      days: 3, 
      title: "Getting Started", 
      description: "You've shown dedication by using the app for 3 consecutive days!",
      achieved: false,
      certificateType: "bronze"
    },
    { 
      days: 7, 
      title: "Weekly Champion", 
      description: "You've maintained your streak for a full week. Great consistency!",
      achieved: false,
      certificateType: "bronze" 
    },
    { 
      days: 14, 
      title: "Fortnight Master", 
      description: "Two weeks of continuous engagement. You're forming a solid habit!",
      achieved: false,
      certificateType: "silver" 
    },
    { 
      days: 30, 
      title: "Monthly Devotee", 
      description: "A full month of daily streaks! Your dedication is impressive.",
      achieved: false,
      certificateType: "gold" 
    },
    { 
      days: 100, 
      title: "Century Club", 
      description: "100 days! You've reached an exceptional milestone that few achieve.",
      achieved: false,
      certificateType: "platinum" 
    }
  ];

  useEffect(() => {
    if (user) {
      loadStreakData();
    } else {
      navigate("/auth");
    }
  }, [user, navigate]);

  const loadStreakData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get user's streak data from user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error("Error loading user profile:", profileError);
        toast.error("Failed to load streak data");
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      let streak = {
        currentStreak: 0,
        lastInteraction: today,
        longestStreak: 0,
        streakStartDate: today
      };
      
      // If streak data exists in the profile
      if (profileData && profileData.activities) {
        const activities = Array.isArray(profileData.activities) ? profileData.activities : [];
        const streakActivity = activities.find((a: any) => a.type === 'streak_data');
        
        if (streakActivity) {
          streak = streakActivity.data as StreakData;
          
          // Check if the streak needs to be updated
          const lastDate = new Date(streak.lastInteraction);
          const currentDate = new Date();
          const timeDiff = currentDate.getTime() - lastDate.getTime();
          const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
          
          if (daysDiff > 1) {
            // Streak broken
            toast.error(`Your ${streak.currentStreak} day streak was broken. Start again today by using the bot!`);
          }
        } else {
          // No streak data yet
          await updateStreakData(streak);
          toast.info("Start your streak by using the bot daily!");
        }
      } else {
        // No streak data yet
        await updateStreakData(streak);
        toast.info("Start your streak by using the bot daily!");
      }
      
      setStreakData(streak);
    } catch (error) {
      console.error("Failed to load streak data:", error);
      toast.error("Failed to load streak data");
    } finally {
      setLoading(false);
    }
  };
  
  const updateStreakData = async (streakData: StreakData) => {
    if (!user) return;
    
    try {
      // Get current user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('activities')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error("Error getting user profile:", profileError);
        return;
      }
      
      let activities = Array.isArray(profileData.activities) ? [...profileData.activities] : [];
      const streakIndex = activities.findIndex((a: any) => a.type === 'streak_data');
      
      if (streakIndex >= 0) {
        // Update existing streak data
        activities[streakIndex] = {
          type: 'streak_data',
          description: `Maintained a streak of ${streakData.currentStreak} days`,
          timestamp: new Date().toISOString(),
          data: streakData
        };
      } else {
        // Add new streak data
        activities.push({
          type: 'streak_data',
          description: `Started a daily streak`,
          timestamp: new Date().toISOString(),
          data: streakData
        });
      }
      
      // Update the profile with new activities
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          activities: activities
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error("Error updating streak data:", updateError);
      }
    } catch (error) {
      console.error("Failed to update streak data:", error);
    }
  };

  const getStreakProgressPercent = (milestone: number) => {
    if (!streakData) return 0;
    const current = streakData.currentStreak;
    const percent = Math.min((current / milestone) * 100, 100);
    return Math.round(percent);
  };

  const getDaysLeft = (milestone: number) => {
    if (!streakData) return milestone;
    const current = streakData.currentStreak;
    return Math.max(0, milestone - current);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const viewCertificate = (milestone: StreakMilestone) => {
    setSelectedMilestone(milestone);
  };

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-background w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-secondary/30 border-b shadow-sm w-full">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => navigate("/")}
            className="p-1 sm:p-1.5 rounded-full bg-secondary/70 hover:bg-secondary"
          >
            <ArrowLeft size={isMobile ? 16 : 18} />
          </button>
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-xs sm:text-sm md:text-lg font-medium">Daily Streaks</h1>
            <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">
              Track your progress and earn certificates
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <ScrollArea className="flex-1 p-2 sm:p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {/* Current streak summary card */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> 
                Current Streak
              </CardTitle>
              <CardDescription>
                Keep using the app daily to maintain your streak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2 sm:mb-4">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-xl sm:text-3xl font-bold text-primary">
                    {loading ? "..." : streakData?.currentStreak || 0}
                    <span className="text-sm sm:text-lg ml-1 text-muted-foreground">days</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Longest Streak</p>
                  <p className="text-xl sm:text-3xl font-bold">
                    {loading ? "..." : streakData?.longestStreak || 0}
                    <span className="text-sm sm:text-lg ml-1 text-muted-foreground">days</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Start Date</p>
                  <p className="text-sm sm:text-base font-medium">
                    {loading ? "..." : streakData ? formatDate(streakData.streakStartDate) : "Not started"}
                  </p>
                </div>
              </div>
              
              {streakData && streakData.currentStreak > 0 && (
                <div className="text-xs sm:text-sm text-center text-muted-foreground mt-2 sm:mt-4">
                  Last interaction: {formatDate(streakData.lastInteraction)}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-1 pb-3 flex justify-center">
              <Button 
                variant="default" 
                size={isMobile ? "sm" : "default"}
                onClick={() => navigate("/bot")}
              >
                Use Bot Today
              </Button>
            </CardFooter>
          </Card>

          {/* Tabs for milestones and certificates */}
          <Tabs defaultValue="milestones" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="milestones">Streak Milestones</TabsTrigger>
              <TabsTrigger value="certificates">Earned Certificates</TabsTrigger>
            </TabsList>
            
            {/* Milestones tab */}
            <TabsContent value="milestones">
              <div className="space-y-3 sm:space-y-4">
                {milestones.map((milestone) => {
                  const isAchieved = streakData && streakData.currentStreak >= milestone.days;
                  const progressPercent = getStreakProgressPercent(milestone.days);
                  const daysLeft = getDaysLeft(milestone.days);
                  
                  return (
                    <Card 
                      key={milestone.days} 
                      className={`${isAchieved ? "bg-primary/5 border-primary" : ""}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            {isAchieved && <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                            {milestone.title}
                          </CardTitle>
                          <span className="text-xs sm:text-sm font-bold">
                            {milestone.days} days
                          </span>
                        </div>
                        <CardDescription>{milestone.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span>Progress</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                          {!isAchieved && (
                            <p className="text-xs text-muted-foreground pt-1">
                              {daysLeft} days left to achieve this milestone
                            </p>
                          )}
                        </div>
                      </CardContent>
                      {isAchieved && (
                        <CardFooter className="pt-0">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size={isMobile ? "sm" : "default"}
                                className="w-full" 
                                onClick={() => viewCertificate(milestone)}
                              >
                                <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-2" /> 
                                View Certificate
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-full max-w-3xl">
                              <Certificate 
                                participantName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                                testTitle={`${milestone.title} Streak Achievement`}
                                testDescription={`Successfully maintained a ${milestone.days}-day streak on Veno`}
                                completedAt={new Date().toISOString()}
                                score={100}
                              />
                            </DialogContent>
                          </Dialog>
                        </CardFooter>
                      )}
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            {/* Certificates tab */}
            <TabsContent value="certificates">
              {streakData && streakData.currentStreak > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {milestones
                    .filter(milestone => streakData.currentStreak >= milestone.days)
                    .map((milestone) => (
                      <Card key={milestone.days} className="border-primary/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Award className="h-4 w-4 text-primary" />
                            {milestone.title}
                          </CardTitle>
                          <CardDescription>
                            {milestone.days}-day streak achievement
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="flex justify-center">
                            <div className="relative w-full h-24 sm:h-32 bg-primary/5 rounded-md flex items-center justify-center">
                              <Award className="h-8 w-8 sm:h-12 sm:w-12 text-primary opacity-30" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs sm:text-sm font-medium">Certificate Preview</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size={isMobile ? "sm" : "default"}
                                className="w-full" 
                                onClick={() => viewCertificate(milestone)}
                              >
                                <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-2" /> 
                                View Certificate
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-full max-w-3xl">
                              <Certificate 
                                participantName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                                testTitle={`${milestone.title} Streak Achievement`}
                                testDescription={`Successfully maintained a ${milestone.days}-day streak on Veno`}
                                completedAt={new Date().toISOString()}
                                score={100}
                              />
                            </DialogContent>
                          </Dialog>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">No Certificates Yet</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mb-4">
                    Start using the bot daily to earn streak certificates for your achievements.
                  </p>
                  <Button onClick={() => navigate("/bot")}>
                    Use Bot Now
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default StreakPage;
