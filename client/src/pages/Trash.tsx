
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatTimeAgo } from "@/lib/utils";
import { useLocation } from "wouter";

interface DeletedVideo {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  deletedAt: string;
  canRestoreUntil: string;
  user: {
    _id: string;
    username: string;
    avatarUrl?: string;
  };
}

export default function Trash() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const { data: deletedVideos, isLoading } = useQuery<{ videos: DeletedVideo[] }>({
    queryKey: ['/api/videos/trash/list'],
  });

  const restoreVideoMutation = useMutation({
    mutationFn: (videoId: string) => 
      fetch(`/api/videos/${videoId}/restore`, {
        method: 'POST'
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos/trash/list'] });
      toast({
        title: "Video restored",
        description: "Your video has been restored successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Restore failed",
        description: error.message || "There was an error restoring the video",
        variant: "destructive",
      });
    }
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (videoId: string) => 
      fetch(`/api/videos/${videoId}/permanent`, {
        method: 'DELETE'
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos/trash/list'] });
      toast({
        title: "Video permanently deleted",
        description: "Your video has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "There was an error deleting the video",
        variant: "destructive",
      });
    }
  });

  const isExpired = (canRestoreUntil: string) => {
    return new Date() > new Date(canRestoreUntil);
  };

  const getDaysLeft = (canRestoreUntil: string) => {
    const now = new Date();
    const expiry = new Date(canRestoreUntil);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Trash</h1>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-32 h-20 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trash</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate('/library')}
            className="text-gray-700 dark:text-gray-300"
          >
            Back to Library
          </Button>
        </div>

        {deletedVideos?.videos?.length === 0 ? (
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardContent className="text-center py-12">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400 mb-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No deleted videos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Videos you delete will appear here for 15 days before being permanently removed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {deletedVideos?.videos?.map((video) => (
              <Card key={video._id} className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={video.thumbnailUrl || '/placeholder-thumbnail.jpg'}
                      alt={video.title}
                      className="w-32 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Deleted {formatTimeAgo(video.deletedAt)}
                      </p>
                      {isExpired(video.canRestoreUntil) ? (
                        <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                          Restoration period expired
                        </p>
                      ) : (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
                          Can be restored for {getDaysLeft(video.canRestoreUntil)} more days
                        </p>
                      )}
                      <div className="flex gap-2">
                        {!isExpired(video.canRestoreUntil) && (
                          <Button
                            size="sm"
                            onClick={() => restoreVideoMutation.mutate(video._id)}
                            disabled={restoreVideoMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {restoreVideoMutation.isPending ? "Restoring..." : "Restore"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => permanentDeleteMutation.mutate(video._id)}
                          disabled={permanentDeleteMutation.isPending}
                        >
                          {permanentDeleteMutation.isPending ? "Deleting..." : "Delete Forever"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
