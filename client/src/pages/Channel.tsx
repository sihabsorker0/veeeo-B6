import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContextFixed";
import { getInitials } from "@/lib/utils";

export default function Channel() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();

  const { data: channelData, isLoading } = useQuery({
    queryKey: [`/api/users/${id}`],
    refetchInterval: 5000, // Poll every 5 seconds
    queryFn: async () => {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      return response.json();
    }
  });

  const { data: channelVideos, isLoading: isLoadingVideos } = useQuery({
    queryKey: [`/api/users/${id}/videos`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${id}/videos`);
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      const data = await response.json();
      return {
        ...data,
        videos: data.videos.map((video: any) => ({
          ...video,
          user: {
            ...video.user,
            ...channelData?.user
          }
        }))
      };
    }
  });

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  const channel = channelData?.user;
  const videos = channelVideos?.videos || [];
  const isOwnChannel = user?._id === channel?._id;

  return (
    <div>
      {/* Channel Header */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6">
        <div className="max-w-5xl mx-auto flex items-center gap-6">
          <Avatar className="h-24 w-24">
            {channel?.avatarUrl ? (
              <AvatarImage src={channel.avatarUrl} alt={channel.username} />
            ) : (
              <AvatarFallback>{getInitials(channel?.username || "")}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{channel?.username}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {channel?.subscribers || 0} subscribers
            </p>
          </div>
          {!isOwnChannel && isAuthenticated && (
            <Button>Subscribe</Button>
          )}
        </div>
      </div>

      {/* Channel Content */}
      <div className="max-w-5xl mx-auto p-4">
        <Tabs defaultValue="videos">
          <TabsList>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            {isLoadingVideos ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-[200px] rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {videos.map((video: any) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="playlists">
            <p>Playlists will appear here</p>
          </TabsContent>

          <TabsContent value="about">
            <div className="space-y-4">
              <p>Channel description will appear here</p>
              <div>
                <h3 className="font-medium">Stats</h3>
                <p>Joined {new Date(channel?.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}