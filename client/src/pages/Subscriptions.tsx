
import { useQuery } from "@tanstack/react-query";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContextFixed";

export default function Subscriptions() {
  const { isAuthenticated } = useAuth();

  const { data: subscriptionVideosData, isLoading: isLoadingVideos } = useQuery({
    queryKey: ['/api/users/subscription-videos'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Subscriptions</h1>
        <p>Sign in to see updates from your favorite channels</p>
      </div>
    );
  }

  if (isLoadingVideos) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-[280px] rounded-xl" />
      ))}
    </div>;
  }

  const videos = subscriptionVideosData?.videos || [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Subscriptions</h1>
      {videos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No videos from subscribed channels yet</p>
          <p className="text-sm text-gray-500">Subscribe to channels to see their latest videos here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video: any) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
