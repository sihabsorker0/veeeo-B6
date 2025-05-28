
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
  targetImpressions: number;
}

export const useAdAvailability = (type: 'pre-roll' | 'mid-roll' | 'post-roll', pollingInterval = 5000) => {
  const { data: ads } = useQuery<Ad[]>({
    queryKey: ['/api/ads/active', { type }],
    refetchInterval: pollingInterval,
  });

  const hasAds = ads && ads.length > 0 && ads.some(ad => 
    ad.adType === type && 
    ad.impressions < ad.targetImpressions
  );
  
  return { hasAds };
};
