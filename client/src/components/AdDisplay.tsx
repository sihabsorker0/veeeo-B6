import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Ad {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  targetUrl: string;
  adType: 'banner' | 'overlay' | 'sidebar' | 'pre-roll' | 'mid-roll' | 'post-roll';
  isActive: boolean;
  budget: number;
  impressions: number;
  clicks: number;
}

interface AdDisplayProps {
  type: 'banner' | 'overlay' | 'sidebar' | 'pre-roll' | 'mid-roll' | 'post-roll';
  className?: string;
  onClose?: (adId?: string) => void;
}



export default function AdDisplay({ type, className = '', onClose }: AdDisplayProps) {
  const { data: ads } = useQuery<Ad[]>({
    queryKey: ['/api/ads/active', { type }],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [isAdCompleted, setIsAdCompleted] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [trackedAds, setTrackedAds] = useState<Set<string>>(new Set());

  // Filter ads by type - this will work for ALL ad types including video ads
  useEffect(() => {
    if (ads && ads.length > 0) {
      // Only show ads that match the requested type and haven't reached their target
      const availableAds = ads.filter(ad => 
        ad.adType === type && 
        ad.impressions < ad.targetImpressions
      );
      if (availableAds.length > 0) {
        const randomAd = availableAds[Math.floor(Math.random() * availableAds.length)];
        setCurrentAd(randomAd);
      } else {
        setCurrentAd(null);
      }
    }
  }, [ads, type]);

  useEffect(() => {
    if (currentAd) {
      trackImpression(currentAd);
    }
  }, [currentAd]);

  const handleAdClick = async (ad: Ad) => {
    // Track click
    try {
      await fetch(`/api/ads/${ad._id}/click`, {
        method: 'POST'
      });
      // Open ad URL
      window.open(ad.targetUrl, '_blank');
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  };

  const handleVideoAdClick = (ad: Ad) => {
    handleAdClick(ad);
  };

  const trackImpression = async (ad: Ad) => {
    try {
      await fetch(`/api/ads/${ad._id}/impression`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  };

  const trackAdImpression = async (adId: string) => {
    // Get video ID from URL params
    const pathParts = window.location.pathname.split('/');
    const videoId = pathParts[pathParts.length - 1];

    if (!videoId) return;

    // Create unique key for this ad impression
    const impressionKey = `${videoId}-${adId}-${type}`;
    
    // Check if we already tracked this ad for this video session
    if (trackedAds.has(impressionKey)) {
      console.log(`Ad impression already tracked for ${impressionKey}`);
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
          adType: type,
          timestamp: Date.now(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log(`Ad impression tracked: ${result.adTitle} - $${result.revenueEarned}`);
        // Mark this ad as tracked for this session
        setTrackedAds(prev => new Set(prev).add(impressionKey));
      }
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  };

  if (!currentAd) return null;

  const renderBannerAd = () => (
    <div 
      className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow ${className}`}
      onClick={() => currentAd && handleAdClick(currentAd)}
    >
      <div className="flex items-center justify-between text-white">
        <div className="flex-1">
          {currentAd?.imageUrl && (
            currentAd.imageUrl.includes('.mp4') || currentAd.imageUrl.includes('.webm') ? (
              <video 
                src={currentAd.imageUrl} 
                className="w-full h-32 object-cover rounded mb-3"
                controls={false}
                autoPlay
                muted
                loop
              />
            ) : (
              <img 
                src={currentAd.imageUrl} 
                alt={currentAd.title}
                className="w-full h-32 object-cover rounded mb-3"
              />
            )
          )}
          <h3 className="font-bold text-lg">{currentAd?.title}</h3>
          <p className="text-sm opacity-90">{currentAd?.description}</p>
        </div>
        <div className="text-xs opacity-75 ml-4">বিজ্ঞাপন</div>
      </div>
    </div>
  );

  const renderSidebarAd = () => (
    <div 
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={() => currentAd && handleAdClick(currentAd)}
    >
      <div className="text-xs text-gray-500 mb-2">স্পন্সর্ড</div>
      <h4 className="font-semibold text-gray-800 dark:text-white mb-2">{currentAd?.title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{currentAd?.description}</p>
      <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
        আরও জানুন
      </button>
    </div>
  );

  const renderOverlay = () => (
    <div 
      className={`absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg cursor-pointer hover:bg-opacity-85 transition-opacity ${className}`}
      onClick={() => currentAd && handleAdClick(currentAd)}
    >
      <div className="text-xs opacity-75 mb-1">বিজ্ঞাপন</div>
      <div className="text-sm font-medium">{currentAd?.title}</div>
    </div>
  );

  const renderVideoAd = () => (
    <div className={`relative w-full h-full ${className}`}>
      {currentAd?.imageUrl && (
        currentAd.imageUrl.includes('.mp4') || currentAd.imageUrl.includes('.webm') ? (
          <video
            className="w-full h-full"
            src={currentAd.imageUrl}
            autoPlay
            playsInline
            muted={false}
            controls
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            onClick={() => currentAd && handleVideoAdClick(currentAd)}
            style={{ objectFit: 'contain', background: 'black' }}
            onEnded={() => {
              setIsAdCompleted(true);
              setShowSkipButton(true);

              // Track ad impression when video ends
              if (currentAd?._id) {
                trackAdImpression(currentAd._id);
              }

              // Auto close after 2 seconds
              setTimeout(() => {
                onClose?.(currentAd?._id);
              }, 2000);
            }}
          />
        ) : (
          <img
            className="w-full h-full object-contain bg-black"
            src={currentAd.imageUrl}
            alt={currentAd.title}
            onClick={() => currentAd && handleVideoAdClick(currentAd)}
          />
        )
      )}
    </div>
  );



  switch (type) {
    case 'banner':
      return renderBannerAd();
    case 'sidebar':
      return renderSidebarAd();
    case 'overlay':
      return renderOverlay();
    case 'pre-roll':
    case 'mid-roll':
    case 'post-roll':
      return (
        <div className="relative w-full h-full">
          {currentAd && (
            <>
              {renderVideoAd()}
              <div className="absolute top-4 right-4 z-50">
                <button 
                  className="bg-black/50 text-white px-4 py-2 rounded hover:bg-black/70"
                  onClick={() => {
                    if (currentAd?._id) {
                      trackAdImpression(currentAd._id);
                    }
                    onClose?.(currentAd?._id);
                  }}
                >
                  Skip Ad
                </button>
              </div>
            </>
          )}
        </div>
      );
    default:
      return renderBannerAd();
  }
}