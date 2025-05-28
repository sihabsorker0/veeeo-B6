import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import AdDisplay from "@/components/AdDisplay";
import { useAdAvailability } from "@/hooks/useAdAvailability";
import 'remixicon/fonts/remixicon.css';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  views: number;
  thumbnailUrl?: string;
}

interface VideoQuality {
  label: string;
  src: string;
}

export default function VideoPlayer({ videoUrl, title, views, thumbnailUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailPreviewRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPreRoll, setShowPreRoll] = useState(false);
  const [showMidRoll, setShowMidRoll] = useState(false);
  const [showPostRoll, setShowPostRoll] = useState(false);
  const [midRollShown, setMidRollShown] = useState(false);
  const [trackedAdSessions, setTrackedAdSessions] = useState<Set<string>>(new Set());

  // Check ad availability
  const { hasAds: hasPreRollAds } = useAdAvailability('pre-roll', 5000); // Check every 5 seconds
  const { hasAds: hasMidRollAds } = useAdAvailability('mid-roll', 5000);
  const { hasAds: hasPostRollAds } = useAdAvailability('post-roll', 5000);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isSubtitlesEnabled, setIsSubtitlesEnabled] = useState(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [buffered, setBuffered] = useState<TimeRanges | null>(null);
  const [qualities] = useState<VideoQuality[]>([
    { label: "1080p", src: videoUrl },
    { label: "720p", src: videoUrl },
    { label: "480p", src: videoUrl },
    { label: "360p", src: videoUrl }
  ]);
  const [currentQuality, setCurrentQuality] = useState(qualities[0]);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTime = useRef(Date.now());
  const analyticsInterval = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch(e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "i":
          toggleMiniPlayer();
          break;
        case "arrowleft":
          videoRef.current.currentTime -= 5;
          break;
        case "arrowright":
          videoRef.current.currentTime += 5;
          break;
        case "arrowup":
          adjustVolume(Math.min(volume + 0.1, 1));
          break;
        case "arrowdown":
          adjustVolume(Math.max(volume - 0.1, 0));
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [volume]);

  // Analytics tracking
  useEffect(() => {
    analyticsInterval.current = setInterval(() => {
      if (isPlaying) {
        // Track viewing time, quality changes, etc.
        const analyticsData = {
          timestamp: Date.now(),
          currentTime,
          quality: currentQuality.label,
          playbackSpeed,
          volume,
          buffered: getBufferedRanges()
        };
        // Send to analytics endpoint
        console.log("Analytics:", analyticsData);
      }
    }, 10000);

    return () => {
      if (analyticsInterval.current) {
        clearInterval(analyticsInterval.current);
      }
    };
  }, [isPlaying, currentTime, currentQuality, playbackSpeed, volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setBuffered(video.buffered);
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setBuffered(video.buffered);

      // Show mid-roll ad at 50% of video only if mid-roll ads are available
      if (video.currentTime >= video.duration * 0.5 && !midRollShown && hasMidRollAds) {
        video.pause();
        setShowMidRoll(true);
        setMidRollShown(true);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      // Only show post-roll ad if post-roll ads are available
      if (hasPostRollAds) {
        setShowPostRoll(true);
      }
    };

    const onProgress = () => {
      setBuffered(video.buffered);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    video.addEventListener('progress', onProgress);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('progress', onProgress);
    };
  }, [hasMidRollAds, midRollShown, hasPostRollAds]);

  // Handle pre-roll ads when component loads
  useEffect(() => {
    if (hasPreRollAds) {
      setShowPreRoll(true);
    }
  }, [hasPreRollAds]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    setShowControls(true);
    lastInteractionTime.current = Date.now();

    controlsTimeoutRef.current = setTimeout(() => {
      if (Date.now() - lastInteractionTime.current >= 3000) {
        setShowControls(false);
      }
    }, 3000);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }

    setIsPlaying(!isPlaying);
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
    resetControlsTimeout();
  };

  const adjustVolume = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);

    if (newVolume === 0) {
      setIsMuted(true);
      video.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    adjustVolume(value[0]);
    resetControlsTimeout();
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    const container = videoContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }

    resetControlsTimeout();
  };

  const toggleMiniPlayer = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsMiniPlayer(false);
      } else {
        await video.requestPictureInPicture();
        setIsMiniPlayer(true);
      }
    } catch (error) {
      console.error("Picture-in-Picture failed:", error);
    }
  };

  const changePlaybackSpeed = (speed: string) => {
    const video = videoRef.current;
    if (!video) return;

    const newSpeed = parseFloat(speed);
    video.playbackRate = newSpeed;
    setPlaybackSpeed(newSpeed);
  };

  const changeQuality = (quality: VideoQuality) => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = video.currentTime;
    const wasPlaying = !video.paused;

    setCurrentQuality(quality);
    video.src = quality.src;
    video.currentTime = currentTime;

    if (wasPlaying) {
      video.play();
    }
  };

  const toggleSubtitles = () => {
    setIsSubtitlesEnabled(!isSubtitlesEnabled);
    // Toggle subtitles track
  };

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getBufferedRanges = () => {
    if (!buffered) return [];

    const ranges = [];
    for (let i = 0; i < buffered.length; i++) {
      ranges.push({
        start: buffered.start(i),
        end: buffered.end(i)
      });
    }
    return ranges;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleMouseEnter = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Track ad impressions for revenue calculation
  const trackAdImpression = useCallback(async (adId: string, adType: string) => {
    // Get video ID from URL params
    const pathParts = window.location.pathname.split('/');
    const videoId = pathParts[pathParts.length - 1];

    if (!videoId) {
      console.error('No video ID found in URL');
      return;
    }

    // Create unique session key for this ad impression
    const sessionKey = `${videoId}-${adId}-${adType}`;
    
    // Check if we already tracked this ad for this video session
    if (trackedAdSessions.has(sessionKey)) {
      console.log(`Ad impression already tracked for ${sessionKey}`);
      return;
    }

    try {
      const response = await fetch('/api/videos/ad-impression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          adId,
          adType,
          timestamp: Date.now(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log(`Ad impression tracked for ${adType} ad ${adId}. Revenue earned: $${result.revenueEarned || 0}`);
        console.log(`Ad title: ${result.adTitle}`);
        // Mark this ad as tracked for this session
        setTrackedAdSessions(prev => new Set(prev).add(sessionKey));
      }
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  }, [trackedAdSessions]);

  const handleAdComplete = (adType: 'pre-roll' | 'mid-roll' | 'post-roll', adId?: string) => {
    // Ad impression tracking is handled by AdDisplay component
    
    if (adType === 'pre-roll') {
      setShowPreRoll(false);
    } else if (adType === 'mid-roll') {
      setShowMidRoll(false);
    } else if (adType === 'post-roll') {
      setShowPostRoll(false);
    }

    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div 
      ref={videoContainerRef}
      id="video-container" 
      className="relative bg-black w-full aspect-video group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      {(showPreRoll || showMidRoll || showPostRoll) && (
        <div className="absolute inset-0 z-50">
          <AdDisplay 
            type={showPreRoll ? "pre-roll" : showMidRoll ? "mid-roll" : "post-roll"}
            className="w-full h-full"
            onClose={(adId?: string) => {
              const adType = showPreRoll ? "pre-roll" : showMidRoll ? "mid-roll" : "post-roll";
              handleAdComplete(adType, adId);
            }}
          />
          <button 
            className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded hover:bg-black/70 transition-colors"
            onClick={() => {
              if (showPreRoll) {
                setShowPreRoll(false);
                videoRef.current?.play();
                setIsPlaying(true);
              } else if (showMidRoll) {
                setShowMidRoll(false);
                videoRef.current?.play();
                setIsPlaying(true);
              } else {
                setShowPostRoll(false);
              }
            }}
          >
            Skip Ad
          </button>
        </div>
      )}


      <video
        ref={videoRef}
        src={currentQuality.src}
        className="w-full h-full"
        poster={thumbnailUrl}
        onClick={togglePlay}
        title={title}
        preload="metadata"
      >
        {/* Add subtitle tracks here */}
        <track 
          kind="subtitles" 
          src="/path/to/subtitles.vtt" 
          label="English"
          default={isSubtitlesEnabled}
        />
      </video>

      {/* Thumbnail preview */}
      <div 
        ref={thumbnailPreviewRef}
        className="absolute top-[-100px] transform -translate-x-1/2 bg-black p-1 rounded hidden group-hover:block"
        data-time="0:00"
      >
        <img src={thumbnailUrl} className="w-32 h-20 object-cover" alt="Preview" />
        <div className="text-white text-xs text-center mt-1" />
      </div>

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20"
          onClick={togglePlay}
        >
          <div className="bg-black/40 rounded-full p-4 hover:bg-black/60 transition-colors">
            <i className="ri-play-fill text-white text-5xl"></i>
          </div>
        </div>
      )}

      {/* Video Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex flex-col gap-2">
          {/* Advanced Progress bar with preview */}
          <div 
            className="relative h-8 -mt-6 group/progress cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              if (thumbnailPreviewRef.current) {
                thumbnailPreviewRef.current.style.opacity = '0';
              }
            }}
            onMouseEnter={() => {
              if (thumbnailPreviewRef.current) {
                thumbnailPreviewRef.current.style.opacity = '1';
              }
            }}
          >
            {/* Preview thumbnail */}
            <div 
              ref={thumbnailPreviewRef}
              className="absolute bottom-8 transform -translate-x-1/2 bg-black rounded-md opacity-0 transition-opacity duration-200"
              style={{ pointerEvents: 'none' }}
            >
              <img 
                src={thumbnailUrl} 
                className="w-32 h-20 object-cover rounded-t-md" 
                alt="Preview" 
              />
              <div className="text-white text-xs text-center py-1 px-2 bg-black/90 rounded-b-md" />
            </div>

            {/* Progress bar container */}
            <div className="absolute bottom-0 left-0 right-0 h-1 group-hover/progress:h-1.5 transition-all duration-200">
              {/* Buffered progress */}
              <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
                {getBufferedRanges().map((range, index) => (
                  <div
                    key={index}
                    className="absolute h-full bg-white/30 backdrop-blur-sm rounded-full"
                    style={{
                      left: `${(range.start / duration) * 100}%`,
                      width: `${((range.end - range.start) / duration) * 100}%`
                    }}
                  />
                ))}
              </div>

              {/* Watched progress */}
              <div 
                className="absolute h-full bg-red-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rounded-full scale-0 group-hover/progress:scale-100 transition-transform duration-200" />
              </div>

              {/* Interactive slider */}
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="absolute inset-0 opacity-0"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 bg-black/60 rounded-full p-2" 
                onClick={togglePlay}
              >
                <i className={`ri-${isPlaying ? 'pause' : 'play'}-fill text-xl`}></i>
              </Button>

              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20" 
                  onClick={toggleMute}
                  onMouseEnter={() => setIsVolumeSliderVisible(true)}
                >
                  <i className={`ri-volume-${isMuted ? 'mute' : volume > 0.5 ? 'up' : 'down'}-fill text-xl`}></i>
                </Button>

                {isVolumeSliderVisible && (
                  <div 
                    className="absolute bottom-full left-0 mb-2 p-2 bg-black/90 rounded-md w-24"
                    onMouseLeave={() => setIsVolumeSliderVisible(false)}
                  >
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                )}
              </div>

              <div className="text-sm">
                <span>{formatTime(currentTime)}</span>
                <span> / </span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs hidden sm:inline-block">
                {formatNumber(views)} views
              </span>

              <Select
                value={playbackSpeed.toString()}
                onValueChange={changePlaybackSpeed}
              >
                <SelectTrigger className="w-[70px] h-8 bg-transparent border-0 text-white hover:bg-white/20">
                  <SelectValue placeholder="Speed" />
                </SelectTrigger>
                <SelectContent>
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <SelectItem key={speed} value={speed.toString()}>
                      {speed}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={currentQuality.label}
                onValueChange={(value) => changeQuality(qualities.find(q => q.label === value)!)}
              >
                <SelectTrigger className="w-[80px] h-8 bg-transparent border-0 text-white hover:bg-white/20">
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent>
                  {qualities.map(quality => (
                    <SelectItem key={quality.label} value={quality.label}>
                      {quality.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20" 
                onClick={toggleSubtitles}
              >
                <i className={`ri-subtitle-${isSubtitlesEnabled ? 'fill' : 'line'} text-xl`}></i>
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20" 
                onClick={toggleMiniPlayer}
              >
                <i className={`ri-picture-in-picture-${isMiniPlayer ? 'exit' : '2'}-line text-xl`}></i>
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20" 
                onClick={toggleFullscreen}
              >
                <i className={`ri-${isFullscreen ? 'fullscreen-exit' : 'fullscreen'}-line text-xl`}></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}