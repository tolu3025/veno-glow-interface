import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

const AiChat = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Bot className="h-16 w-16 text-veno-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl">AI Chat Assistant</CardTitle>
          <CardDescription className="text-base">
            This feature is currently under maintenance. We're working to improve your AI chat experience.
            Please check back soon!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p className="mb-4">🔧 Expected to be back online shortly</p>
          <p className="text-sm">Thank you for your patience!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiChat;
