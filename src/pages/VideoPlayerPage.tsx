import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VideoPlayerPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/ai-tutorial/resources');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Wrench className="h-16 w-16 text-veno-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Video Tutorials</CardTitle>
          <CardDescription className="text-base">
            This feature is currently under maintenance. We're working to improve your video learning experience.
            Please check back soon!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p className="mb-4">🔧 Expected to be back online shortly</p>
          <p className="text-sm">Thank you for your patience!</p>
          <Button 
            onClick={handleBack} 
            className="mt-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoPlayerPage;
