
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mail, Settings, Clock } from 'lucide-react';

const UnderMaintenancePage = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-5xl py-12">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Under Maintenance</h1>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-6">
              <Settings className="h-12 w-12 text-amber-600 dark:text-amber-400 animate-spin-slow" />
            </div>
            <h2 className="text-2xl font-bold mb-4">We're working on it!</h2>
            <p className="text-muted-foreground mb-6 max-w-lg">
              This page is currently under maintenance. Our team is working hard to improve your experience.
              Please check back later.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span>Expected completion: Soon</span>
            </div>
            <Button 
              onClick={() => navigate('/')} 
              className="mt-6"
            >
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Need assistance?</h2>
          <p className="text-muted-foreground mb-6">
            If you need immediate help or have any questions, please contact us using one of the email addresses below:
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start p-4 border rounded-lg">
              <div className="mr-4 mt-1">
                <Mail className="h-5 w-5 text-veno-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">General Inquiries</h3>
                <a href="mailto:cbtveno@gmail.com" className="text-veno-primary hover:underline break-all">
                  cbtveno@gmail.com
                </a>
              </div>
            </div>
            
            <div className="flex items-start p-4 border rounded-lg">
              <div className="mr-4 mt-1">
                <Mail className="h-5 w-5 text-veno-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Technical Support</h3>
                <a href="mailto:support@venobot.online" className="text-veno-primary hover:underline break-all">
                  support@venobot.online
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnderMaintenancePage;
