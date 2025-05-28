import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import VideoModal from "@/components/VideoModal";
import AdDisplay from "@/components/AdDisplay";
import { Link } from "wouter";

export default function Home() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/videos'],
    refetchInterval: 5000, // Poll every 5 seconds
    queryFn: async () => {
      const res = await fetch('/api/videos');
      return res.json();
    },
  });

  const videos = data?.videos || [];

  const openVideoModal = (video: any) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  return (
    <>
      {/* Banner Ad */}
      <div className="p-4">
        <AdDisplay type="banner" className="mb-6" />
      </div>

      {/* Video Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <Skeleton className="w-full aspect-video rounded-lg" />
                <div className="pt-3">
                  <div className="flex gap-3">
                    <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video: any) => (
              <div key={video._id} onClick={() => openVideoModal(video)} className="cursor-pointer">
                <VideoCard video={video} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)]">
            <div className="flex flex-col items-center">
              <svg width="80" height="80" viewBox="0 0 24 24" className="text-gray-400 mb-5">
                <path d="M12,6.5 L12,17.5 M17.5,12 L6.5,12" stroke="currentColor" strokeWidth="2" fill="none"></path>
              </svg>
              <h3 className="text-xl font-medium mb-1">No videos found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                No videos have been uploaded yet
              </p>
            </div>
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