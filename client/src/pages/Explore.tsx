import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import VideoModal from "@/components/VideoModal";

export default function Explore() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/videos'],
  });

  const videos = data?.videos || [];

  const openVideoModal = (video: any) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  return (
    <>
      {/* Video Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden bg-lightCard dark:bg-darkCard">
                <Skeleton className="w-full aspect-video" />
                <div className="p-3">
                  <div className="flex">
                    <Skeleton className="h-9 w-9 rounded-full flex-shrink-0 mr-3" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video: any) => (
              <div key={video._id} onClick={() => openVideoModal(video)}>
                <VideoCard video={video} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="ri-search-line text-5xl text-gray-400 dark:text-gray-600 mb-4"></i>
            <h3 className="text-xl font-medium">No videos found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              No videos available.
            </p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          video={selectedVideo}
        />
      )}
    </>
  );
}