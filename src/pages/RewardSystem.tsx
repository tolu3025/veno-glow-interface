
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trophy, Gift, Share2, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { appendToUserActivities } from '@/utils/activityHelpers';

const RewardSystem = () => {
  const [userPoints, setUserPoints] = useState(0);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      // Check if offline first
      if (!navigator.onLine) {
        setIsOffline(true);
        setIsLoading(false);
        toast({
          title: "You're offline",
          description: "Reward data will be limited until you're back online",
          variant: "default",
        });
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('points, activities')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // No profile found, create one
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                user_id: user.id,
                email: user.email,
                points: 100, // Start with some points
                activities: [{
                  type: 'login',
                  description: 'First login',
                  timestamp: new Date().toISOString(),
                  points: 100
                }]
              });
            
            if (insertError) {
              console.error("Error creating user profile:", insertError);
              toast({
                title: "No points available",
                description: "We'll add points as you complete tasks",
                variant: "default",
              });
            } else {
              setUserPoints(100);
              toast({
                title: "Welcome to Rewards!",
                description: "We've given you 100 points to get started.",
              });
            }
          } else {
            console.error("Error fetching user profile:", error);
            toast({
              title: "No points available",
              description: "We'll add points as you complete tasks",
              variant: "default",
            });
          }
        } else if (data) {
          setUserPoints(data.points || 0);
        }
      } catch (error) {
        console.error("Error fetching user points:", error);
        toast({
          title: "No points available",
          description: "We'll add points as you complete tasks",
          variant: "default",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPoints();
  }, [user, toast, isOffline]);
  
  // Render offline page if detected
  if (isOffline) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Veno Rewards</h1>
        </div>
        
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center">
            <WifiOff className="h-16 w-16 text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">You're currently offline</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Veno Rewards requires an internet connection to track your progress and award points.
              Please check your connection and try again.
            </p>
            <Button 
              className="bg-veno-primary hover:bg-veno-primary/90"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
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
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Veno Rewards</h1>
      </div>
      
      <Card className="mb-8 border border-veno-primary/20 bg-gradient-to-br from-card/50 to-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1 flex items-center">
                <Trophy className="h-6 w-6 text-veno-primary mr-2" />
                Your Reward Points
              </h2>
              <p className="text-muted-foreground">Complete tasks, take quizzes, and earn rewards</p>
            </div>
            <div className="mt-4 md:mt-0">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-veno-primary"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="text-3xl font-bold">{userPoints} <span className="text-veno-primary">pts</span></div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-dashed border-2 border-veno-primary/30">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-2 flex items-center justify-center">
            <Share2 className="mr-2 h-5 w-5 text-veno-primary" /> 
            Refer a Friend
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share Veno with your friends and earn 100 points for each successful referral
          </p>
          <Button 
            onClick={handleReferralLink}
            className="bg-veno-primary hover:bg-veno-primary/90"
          >
            Get Referral Link
          </Button>
        </CardContent>
      </Card>

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

export default RewardSystem;
