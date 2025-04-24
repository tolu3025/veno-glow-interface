
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import VideoPlayer from '@/components/tutorials/VideoPlayer';
import { Skeleton } from '@/components/ui/skeleton';

const VideoPlayerPage = () => {
  const [tutorial, setTutorial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tutorialId = searchParams.get('id');

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!tutorialId) return;

      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .eq('id', tutorialId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching tutorial:', error);
        return;
      }

      setTutorial(data);
      setIsLoading(false);
    };

    fetchTutorial();
  }, [tutorialId]);

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="w-full aspect-video rounded-lg" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">Tutorial not found</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto space-y-6">
      <VideoPlayer 
        videoUrl={tutorial.video_url} 
        thumbnailUrl={tutorial.thumbnail_url} 
      />
      
      <div>
        <h1 className="text-2xl font-bold">{tutorial.title}</h1>
        <p className="text-muted-foreground mt-2">{tutorial.description}</p>
        
        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <span>Duration: {tutorial.duration}</span>
          <span>Level: {tutorial.level}</span>
          <span>Subject: {tutorial.subject}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerPage;
