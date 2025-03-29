import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Award, Trophy, Edit2, LogOut } from "lucide-react";
import { VenoLogo } from "@/components/ui/logo";
import { useAuth } from "@/providers/AuthProvider";
import AppNavigation from "@/components/cbt/AppNavigation";
import ProfileEditor from "@/components/profile/ProfileEditor";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  return (
    <div className="pb-20 md:pb-6 md:pl-64">
      <AppNavigation />
      
      <div className="flex items-center mb-6">
        <VenoLogo className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>
      
      {user ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-3xl">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-1">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </h2>
                  <p className="text-muted-foreground mb-2">{user.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="secondary">Quiz Master</Badge>
                    <Badge variant="outline" className="bg-veno-primary/10 text-veno-primary border-veno-primary/20">
                      120 Points
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-destructive" onClick={signOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <ProfileEditor 
            open={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
          />
          
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-veno-primary" />
                  Completed Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Tests completed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-veno-primary" />
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">78%</p>
                <div className="w-full mt-2 bg-secondary rounded-full h-2.5">
                  <div className="bg-veno-primary h-2.5 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Award className="h-5 w-5 mr-2 text-veno-primary" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">7/12</p>
                <Progress value={58} className="h-2.5 mt-2" />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest quiz results and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className={`rounded-full p-2 ${i % 2 === 0 ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                      {i % 2 === 0 ? <Trophy size={16} /> : <BookOpen size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {i % 2 === 0 ? 'Completed JavaScript Quiz' : 'Earned "Quick Learner" Badge'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {i === 1 ? '2 hours ago' : i === 2 ? 'Yesterday' : '3 days ago'}
                      </p>
                    </div>
                    {i % 2 === 0 && (
                      <Badge className="text-sm" variant="outline">
                        85%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-medium mb-4">Please Sign In</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to view your profile.
            </p>
            <Button 
              className="bg-veno-primary hover:bg-veno-primary/90"
              onClick={() => window.location.href = '/auth'}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
