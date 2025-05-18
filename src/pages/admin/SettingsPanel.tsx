
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Upload, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SettingsPanel = () => {
  const [generalSettings, setGeneralSettings] = useState({
    platformName: "Veno",
    platformDescription: "Online Learning Platform",
    maintenanceMode: false,
    allowRegistrations: true,
    privacyPolicy: "Our detailed privacy policy...",
    termsOfService: "Terms of Service content here...",
  });
  
  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "smtp.example.com",
    smtpPort: "587",
    smtpUsername: "notifications@example.com",
    smtpPassword: "********",
    fromEmail: "no-reply@example.com",
    fromName: "Veno Platform",
    emailFooter: "© 2023 Veno. All rights reserved."
  });
  
  const [integrationSettings, setIntegrationSettings] = useState({
    googleAnalyticsId: "UA-XXXXX-X",
    recaptchaSiteKey: "6LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX",
    googleMapsApiKey: "******************",
    openaiApiKey: "sk-************************",
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  // In a real implementation, these would be saved to your database
  const handleSaveSettings = async (settingType: 'general' | 'email' | 'integrations') => {
    try {
      setIsSaving(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success(`${settingType.charAt(0).toUpperCase() + settingType.slice(1)} settings saved successfully`);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings Panel</h1>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure platform-wide settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input 
                  id="platformName" 
                  value={generalSettings.platformName}
                  onChange={(e) => setGeneralSettings({...generalSettings, platformName: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platformDescription">Platform Description</Label>
                <Textarea 
                  id="platformDescription" 
                  value={generalSettings.platformDescription}
                  onChange={(e) => setGeneralSettings({...generalSettings, platformDescription: e.target.value})}
                  rows={2}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, only admins can access the platform
                  </p>
                </div>
                <Switch 
                  id="maintenanceMode"
                  checked={generalSettings.maintenanceMode}
                  onCheckedChange={(checked) => setGeneralSettings({...generalSettings, maintenanceMode: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowRegistrations">Allow Registrations</Label>
                  <p className="text-sm text-muted-foreground">
                    When disabled, new users cannot register
                  </p>
                </div>
                <Switch 
                  id="allowRegistrations"
                  checked={generalSettings.allowRegistrations}
                  onCheckedChange={(checked) => setGeneralSettings({...generalSettings, allowRegistrations: checked})}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveSettings('general')} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Legal Documents</CardTitle>
              <CardDescription>
                Manage privacy policy and terms of service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                <Textarea 
                  id="privacyPolicy" 
                  value={generalSettings.privacyPolicy}
                  onChange={(e) => setGeneralSettings({...generalSettings, privacyPolicy: e.target.value})}
                  rows={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="termsOfService">Terms of Service</Label>
                <Textarea 
                  id="termsOfService" 
                  value={generalSettings.termsOfService}
                  onChange={(e) => setGeneralSettings({...generalSettings, termsOfService: e.target.value})}
                  rows={6}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveSettings('general')} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Legal Documents
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure email sending settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpServer">SMTP Server</Label>
                  <Input 
                    id="smtpServer" 
                    value={emailSettings.smtpServer}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpServer: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input 
                    id="smtpPort" 
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input 
                    id="smtpUsername" 
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input 
                    id="smtpPassword" 
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input 
                    id="fromEmail" 
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input 
                    id="fromName" 
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailFooter">Email Footer</Label>
                <Textarea 
                  id="emailFooter" 
                  value={emailSettings.emailFooter}
                  onChange={(e) => setEmailSettings({...emailSettings, emailFooter: e.target.value})}
                  rows={2}
                />
              </div>
              
              <div className="pt-4">
                <h3 className="font-medium mb-2">Email Templates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Select defaultValue="welcome">
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome Email</SelectItem>
                      <SelectItem value="reset">Password Reset</SelectItem>
                      <SelectItem value="verify">Email Verification</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button>Edit Template</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Test Email</Button>
              <Button onClick={() => handleSaveSettings('email')} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Email Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Integrations</CardTitle>
              <CardDescription>
                Configure third-party service integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics Tracking ID</Label>
                <Input 
                  id="googleAnalyticsId" 
                  value={integrationSettings.googleAnalyticsId}
                  onChange={(e) => setIntegrationSettings({...integrationSettings, googleAnalyticsId: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recaptchaSiteKey">Google reCAPTCHA Site Key</Label>
                <Input 
                  id="recaptchaSiteKey" 
                  value={integrationSettings.recaptchaSiteKey}
                  onChange={(e) => setIntegrationSettings({...integrationSettings, recaptchaSiteKey: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="googleMapsApiKey">Google Maps API Key</Label>
                <Input 
                  id="googleMapsApiKey" 
                  value={integrationSettings.googleMapsApiKey}
                  onChange={(e) => setIntegrationSettings({...integrationSettings, googleMapsApiKey: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                <Input 
                  id="openaiApiKey" 
                  type="password"
                  value={integrationSettings.openaiApiKey}
                  onChange={(e) => setIntegrationSettings({...integrationSettings, openaiApiKey: e.target.value})}
                />
              </div>
              
              <div className="pt-4">
                <h3 className="font-medium mb-2">OAuth Providers</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Google</p>
                      <p className="text-sm text-muted-foreground">
                        Enable Google login
                      </p>
                    </div>
                    <Switch id="googleAuth" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">GitHub</p>
                      <p className="text-sm text-muted-foreground">
                        Enable GitHub login
                      </p>
                    </div>
                    <Switch id="githubAuth" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Twitter</p>
                      <p className="text-sm text-muted-foreground">
                        Enable Twitter login
                      </p>
                    </div>
                    <Switch id="twitterAuth" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveSettings('integrations')} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Integration Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPanel;
