
import { useState, useRef } from 'react';
import { Share2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import Comments from './Comments';

interface TutorialDetailsProps {
  tutorial: {
    id: string;
    title: string;
    description: string;
    video_url?: string;
    thumbnail_url?: string;
  };
}

const TutorialDetails = ({ tutorial }: TutorialDetailsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleShare = () => {
    const shareData = {
      title: tutorial.title,
      text: tutorial.description,
      url: `${window.location.origin}/tutorial/info?id=${tutorial.id}`
    };

    if (navigator.share && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Link copied!",
        description: "Tutorial link copied to clipboard",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {tutorial.video_url ? (
          <>
            <video
              ref={videoRef}
              src={tutorial.video_url}
              className="w-full h-full"
              poster={tutorial.thumbnail_url}
              onEnded={() => setIsPlaying(false)}
              controls
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-white/20 hover:bg-white/40"
                  onClick={togglePlayPause}
                >
                  <Play className="h-8 w-8 text-white" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <p className="text-muted-foreground">No video available</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{tutorial.title}</h1>
        <Button variant="outline" size="icon" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-muted-foreground">{tutorial.description}</p>

      <div className="mt-8 pt-8 border-t">
        <Comments tutorialId={tutorial.id} />
      </div>
    </div>
  );
};

export default TutorialDetails;
