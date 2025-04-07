
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/ThemeProvider";
import { Moon, Sun, Bell, Volume2, Clock, ScreenShare } from "lucide-react";
import { VenoLogo } from "@/components/ui/logo";
import AppNavigation from "@/components/cbt/AppNavigation";

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = React.useState(true);
  const [sound, setSound] = React.useState(true);
  const [autoStart, setAutoStart] = React.useState(false);
  const [shareResults, setShareResults] = React.useState(true);
  const [timeLimit, setTimeLimit] = React.useState([15]);
  
  return (
    <div className="pb-20 md:pb-6 md:pl-64">
      <AppNavigation />
      
      <div className="flex items-center mb-6">
        <VenoLogo className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how Veno looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <Label htmlFor="theme-mode">Theme</Label>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">Light</span>
                <Switch 
                  id="theme-mode" 
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <span className="text-sm text-muted-foreground">Dark</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <Label htmlFor="notifications">Push Notifications</Label>
              </div>
              <Switch 
                id="notifications" 
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-5 w-5" />
                <Label htmlFor="sound">Sound Effects</Label>
              </div>
              <Switch 
                id="sound" 
                checked={sound}
                onCheckedChange={setSound}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quiz Preferences</CardTitle>
            <CardDescription>Configure default quiz settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <Label htmlFor="time-limit">Default Time Limit</Label>
              </div>
              <div className="flex items-center gap-4 w-1/2">
                <Slider
                  id="time-limit"
                  value={timeLimit}
                  min={5}
                  max={30}
                  step={5}
                  onValueChange={setTimeLimit}
                />
                <span className="w-12 text-right">{timeLimit}m</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ScreenShare className="h-5 w-5" />
                <Label htmlFor="share-results">Share Results</Label>
              </div>
              <Switch 
                id="share-results" 
                checked={shareResults}
                onCheckedChange={setShareResults}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <Label htmlFor="auto-start">Auto-start Quiz</Label>
              </div>
              <Switch 
                id="auto-start" 
                checked={autoStart}
                onCheckedChange={setAutoStart}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button className="bg-veno-primary hover:bg-veno-primary/90">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
