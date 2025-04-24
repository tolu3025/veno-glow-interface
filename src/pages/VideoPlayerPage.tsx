
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import VideoPlayer from '@/components/tutorials/VideoPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Comments from '@/components/tutorials/Comments';

const VideoPlayerPage = () => {
  const [tutorial, setTutorial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tutorialId = searchParams.get('id');

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!tutorialId) {
        setError("No tutorial ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tutorials')
          .select('*')
          .eq('id', tutorialId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching tutorial:', error);
          setError("Failed to fetch tutorial data");
          return;
        }

        if (!data) {
          setError("Tutorial not found");
          return;
        }

        console.log("Fetched tutorial data:", data);
        setTutorial(data);
      } catch (err) {
        console.error('Unexpected error fetching tutorial:', err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutorial();
  }, [tutorialId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleShare = () => {
    if (!tutorial) return;
    
    const shareData = {
      title: tutorial.title,
      text: tutorial.description,
      url: `${window.location.origin}/tutorial/watch?id=${tutorial.id}`
    };

    if (navigator.share && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert("Video link copied to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="w-full aspect-video rounded-lg" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 py-16">
          <p className="text-center text-muted-foreground">{error || "Tutorial not found"}</p>
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      {tutorial.video_url ? (
        <VideoPlayer 
          videoUrl={tutorial.video_url} 
          thumbnailUrl={tutorial.thumbnail_url} 
        />
      ) : (
        <div className="w-full aspect-video bg-muted flex items-center justify-center rounded-lg">
          <p className="text-muted-foreground">No video available for this tutorial</p>
        </div>
      )}
      
      <div>
        <h1 className="text-2xl font-bold">{tutorial.title}</h1>
        <p className="text-muted-foreground mt-2">{tutorial.description}</p>
        
        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <span>Duration: {tutorial.duration}</span>
          <span>Level: {tutorial.level}</span>
          <span>Subject: {tutorial.subject}</span>
        </div>

        <div className="mt-6">
          <Button variant="outline" onClick={handleShare}>
            Share
          </Button>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t">
        <Comments tutorialId={tutorial.id} />
      </div>
    </div>
  );
};

export default VideoPlayerPage;
