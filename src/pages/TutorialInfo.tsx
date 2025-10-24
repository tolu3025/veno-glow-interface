import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TutorialInfo = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Wrench className="h-16 w-16 text-veno-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Study Materials & Tutorials</CardTitle>
          <CardDescription className="text-base">
            This feature is currently under maintenance. We're working to improve your learning experience.
            Please check back soon!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p className="mb-4">🔧 Expected to be back online shortly</p>
          <p className="text-sm">Thank you for your patience!</p>
          <Button 
            onClick={() => window.history.back()} 
            className="mt-6"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialInfo;
