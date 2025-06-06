
import { useState, useRef } from 'react';
import { Share2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import Comments from './Comments';
import AdPlacement from '@/components/ads/AdPlacement';

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
  const navigate = useNavigate();

  const handleShare = () => {
    const shareData = {
      title: tutorial.title,
      text: tutorial.description,
      url: `${window.location.origin}/tutorial/watch?id=${tutorial.id}`
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

  const handleWatchVideo = () => {
    console.log("Navigating to video player with ID:", tutorial.id);
    navigate(`/tutorial/watch?id=${tutorial.id}`);
  };

  return (
    <div className="space-y-6">
      <div 
        className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer"
        onClick={handleWatchVideo}
      >
        {tutorial.thumbnail_url && (
          <img
            src={tutorial.thumbnail_url}
            alt={tutorial.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/20 hover:bg-white/40"
            onClick={(e) => {
              e.stopPropagation(); // Prevent the parent onClick from firing
              handleWatchVideo();
            }}
          >
            <Play className="h-8 w-8 text-white" />
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{tutorial.title}</h1>
        <Button variant="outline" size="icon" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-muted-foreground">{tutorial.description}</p>
      
      {/* Added ad placement with content check disabled */}
      <div className="my-6">
        <AdPlacement location="article" contentCheck={false} />
      </div>

      <div className="mt-8 pt-8 border-t">
        <Comments tutorialId={tutorial.id} />
      </div>
      
      {/* Added another ad placement at the bottom */}
      <div className="mt-8">
        <AdPlacement location="article-middle" contentCheck={false} />
      </div>
    </div>
  );
};

export default TutorialDetails;
