
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import TutorialDetails from '@/components/tutorials/TutorialDetails';
import AdPlacement from '@/components/ads/AdPlacement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Clock, Users, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  subject: string;
  duration: string;
  level: string;
  rating: number;
  students_count: number;
  thumbnail_url?: string;
  video_url?: string;
}

const TutorialInfo = () => {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tutorialId = searchParams.get('id');

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!tutorialId) return;

      // For now, since we don't have real tutorial data in the database,
      // we'll use mock data
      const mockTutorial: Tutorial = {
        id: tutorialId,
        title: 'Advanced Mathematics: Calculus Fundamentals',
        description: 'A comprehensive course covering the fundamentals of calculus, including limits, derivatives, integrals, and their applications in solving real-world problems. This tutorial is designed for students who have a basic understanding of algebra and want to advance their mathematical knowledge.',
        subject: 'Mathematics',
        duration: '4 hours',
        level: 'Intermediate',
        rating: 4.7,
        students_count: 1245,
        thumbnail_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop',
      };
      
      setTutorial(mockTutorial);
      setIsLoading(false);
      
      // In a real implementation, we would fetch from Supabase like this:
      /*
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .eq('id', tutorialId)
        .single();

      if (error) {
        console.error('Error fetching tutorial:', error);
        return;
      }

      setTutorial(data);
      setIsLoading(false);
      */
    };

    fetchTutorial();
  }, [tutorialId]);

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse flex flex-col w-full space-y-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="container py-8 max-w-4xl">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Tutorial not found</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              The tutorial you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {tutorial.subject}
              </Badge>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
                <span className="font-medium">{tutorial.rating}</span>
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl">{tutorial.title}</CardTitle>
            <CardDescription className="text-base mt-2">
              {tutorial.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                <span>{tutorial.duration}</span>
              </div>
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 text-muted-foreground mr-2" />
                <span>{tutorial.level}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-muted-foreground mr-2" />
                <span>{tutorial.students_count} students</span>
              </div>
            </div>
            
            {tutorial && <TutorialDetails tutorial={tutorial} />}
          </CardContent>
        </Card>
        <AdPlacement location="content" />
      </div>
    </div>
  );
};

export default TutorialInfo;
