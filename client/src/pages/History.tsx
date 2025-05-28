import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContextFixed";
import { clearWatchHistory } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import { useState } from "react";
import VideoModal from "@/components/VideoModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function History() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/history'],
    enabled: isAuthenticated,
  });

  const videos = data?.videos || [];

  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: clearWatchHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
      toast({
        title: "History cleared",
        description: "Your watch history has been cleared successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to clear history",
        description: error.message || "There was an error clearing your watch history",
        variant: "destructive",
      });
    }
  });

  const handleClearHistory = () => {
    clearHistoryMutation.mutate();
  };

  const openVideoModal = (video: any) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <i className="ri-history-line text-5xl text-gray-400 dark:text-gray-600 mb-4"></i>
        <h2 className="text-2xl font-bold mb-2">Watch History</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sign in to access your watch history
        </p>
        <Button onClick={() => setIsAuthModalOpen(true)}>
          Sign In
        </Button>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Watch History</h1>
        {videos.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                disabled={clearHistoryMutation.isPending}
              >
                {clearHistoryMutation.isPending ? "Clearing..." : "Clear All History"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete your entire watch history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearHistory}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

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
          <i className="ri-history-line text-5xl text-gray-400 dark:text-gray-600 mb-4"></i>
          <h3 className="text-xl font-medium">No watch history</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Videos you watch will appear here.
          </p>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          video={selectedVideo}
        />
      )}
    </div>
  );
}
