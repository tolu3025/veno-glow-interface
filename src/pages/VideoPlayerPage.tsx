
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Info } from 'lucide-react';
import TutorialDetails from '@/components/tutorials/TutorialDetails';
import VideoPlayer from '@/components/tutorials/VideoPlayer';
import { useStreak } from '@/providers/StreakProvider';
import { toast } from 'sonner';

const VideoPlayerPage = () => {
  const [searchParams] = useSearchParams();
  const tutorialId = searchParams.get('id');
  const [tutorial, setTutorial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { addVideoWatch } = useStreak();

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!tutorialId) {
        setError('No tutorial ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('tutorials')
          .select('*')
          .eq('id', tutorialId)
          .single();

        if (fetchError) {
          console.error('Error fetching tutorial:', fetchError);
          setError('Failed to load tutorial');
          setIsLoading(false);
          return;
        }

        if (!data) {
          setError('Tutorial not found');
          setIsLoading(false);
          return;
        }
        
        console.log('Tutorial data:', data);
        setTutorial(data);
        
        // Update tutorials table to increment view count if user is logged in
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          try {
            // Record user view in the streak system
            addVideoWatch(tutorialId);
            console.log("User viewed tutorial:", tutorialId);
          } catch (err) {
            console.error("Error recording view:", err);
          }
        }
      } catch (err) {
        console.error('Error fetching tutorial:', err);
        setError('An unexpected error occurred');
        toast.error('Failed to load tutorial data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutorial();
  }, [tutorialId, addVideoWatch]);

  const handleBack = () => {
    navigate('/tutorial');
  };

  if (isLoading) {
    return (
      <div className="container py-6 md:py-8 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={handleBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tutorials
          </Button>
        </div>
        <Skeleton className="w-full aspect-video rounded-lg mb-6" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="container py-6 md:py-8 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tutorials
          </Button>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-6 rounded-lg flex items-center">
          <Info className="h-12 w-12 mr-4 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h2 className="text-xl font-bold mb-2">Tutorial Not Available</h2>
            <p>{error || 'The requested tutorial could not be found'}</p>
            <Button 
              onClick={handleBack} 
              className="mt-4"
              variant="default"
            >
              Browse Available Tutorials
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tutorials
        </Button>
      </div>

      {tutorial.video_url ? (
        <VideoPlayer
          videoUrl={tutorial.video_url}
          thumbnailUrl={tutorial.thumbnail_url}
          title={tutorial.title}
          videoId={tutorial.id}
        />
      ) : (
        <div className="bg-muted p-8 rounded-lg text-center mb-6">
          <Info className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Video Not Available</h3>
          <p>The video for this tutorial is not currently available.</p>
        </div>
      )}

      <div className="mt-8">
        <TutorialDetails tutorial={tutorial} />
      </div>
    </div>
  );
};

export default VideoPlayerPage;
