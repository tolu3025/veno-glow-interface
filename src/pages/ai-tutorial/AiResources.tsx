import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, FileText, Video, MessageSquare, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AiResources = () => {
  const navigate = useNavigate();

  const resources = [
    {
      title: 'AI Chat Assistant',
      description: 'Get instant answers to your questions with our AI-powered chat',
      icon: MessageSquare,
      link: '/ai-tutorial/chat',
      color: 'bg-blue-500'
    },
    {
      title: 'Subject Tutorials',
      description: 'Browse comprehensive tutorials across various subjects',
      icon: BookOpen,
      link: '/tutorial/categories',
      color: 'bg-green-500'
    },
    {
      title: 'AI Test Generator',
      description: 'Create custom tests using AI technology',
      icon: Brain,
      link: '/cbt/ai-create',
      color: 'bg-purple-500'
    },
    {
      title: 'Study Materials',
      description: 'Access curated study materials and resources',
      icon: FileText,
      link: '/cbt/library',
      color: 'bg-orange-500'
    },
    {
      title: 'Video Tutorials',
      description: 'Watch educational videos on various topics',
      icon: Video,
      link: '/tutorial/categories',
      color: 'bg-red-500'
    },
    {
      title: 'Learning Tips',
      description: 'Discover effective study strategies and tips',
      icon: Lightbulb,
      link: '/ai-tutorial/learning-tips',
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Learning Resources</h1>
        <p className="text-muted-foreground">
          Explore our comprehensive collection of AI-powered learning tools and resources
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <Card key={resource.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`h-12 w-12 rounded-lg ${resource.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate(resource.link)}
                  className="w-full"
                >
                  Explore
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Our AI chat assistant is available 24/7 to answer your questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/ai-tutorial/chat')} size="lg">
            <MessageSquare className="mr-2 h-5 w-5" />
            Start Chatting
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiResources;
