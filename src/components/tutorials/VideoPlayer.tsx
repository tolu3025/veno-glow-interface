import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Captions, CaptionsOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string; // Added title prop as optional
}

const VideoPlayer = ({ videoUrl, thumbnailUrl, title }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Set up event listener for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Hide controls after 3 seconds of inactivity when playing
  useEffect(() => {
    if (isPlaying) {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    }

    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const handleMouseMove = () => {
    if (isPlaying) {
      setShowControls(true);
      
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleCaptions = () => {
    if (videoRef.current) {
      const track = videoRef.current.textTracks[0];
      if (track) {
        track.mode = showCaptions ? 'hidden' : 'showing';
        setShowCaptions(!showCaptions);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      videoRef.current.muted = newMutedState;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden cursor-pointer"
      onClick={togglePlay}
      onMouseMove={handleMouseMove}
    >
      {title && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
          <h2 className="text-white text-lg font-medium truncate">{title}</h2>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnd}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        <track 
          kind="captions" 
          src="/captions/default.vtt" 
          srcLang="en" 
          label="English"
          default 
        />
      </video>
      
      {/* Play button overlay when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-white/30 text-white hover:bg-white/40"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            <Play className="h-10 w-10" />
          </Button>
        </div>
      )}
      
      {/* Controls that hide when playing */}
      {showControls && (
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <div className="w-24">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCaptions}
                  className="text-white hover:bg-white/20"
                >
                  {showCaptions ? 
                    <Captions className="h-5 w-5" /> : 
                    <CaptionsOff className="h-5 w-5" />
                  }
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? 
                    <Minimize className="h-5 w-5" /> : 
                    <Maximize className="h-5 w-5" />
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
