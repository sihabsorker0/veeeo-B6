
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContextFixed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import VideoCard from "@/components/VideoCard";
import { apiRequest } from "@/lib/api";
import { useLocation } from "wouter";

export default function Playlists() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);

  const { data: playlists = [] } = useQuery({
    queryKey: ['/api/playlists'],
    enabled: isAuthenticated
  });

  const { data: playlistDetails } = useQuery({
    queryKey: [`/api/playlists/${selectedPlaylist?._id}`],
    enabled: !!selectedPlaylist?._id
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (title: string) => {
      return apiRequest('/api/playlists', {
        method: 'POST',
        body: JSON.stringify({ title })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setNewPlaylistTitle("");
      setIsDialogOpen(false);
    }
  });

  const removeFromPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, videoId }: { playlistId: string, videoId: string }) => {
      return apiRequest(`/api/playlists/${playlistId}/videos/${videoId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${selectedPlaylist?._id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
    }
  });

  const handleCreatePlaylist = () => {
    if (newPlaylistTitle.trim()) {
      createPlaylistMutation.mutate(newPlaylistTitle);
    }
  };

  const handlePlaylistClick = (playlist: any) => {
    setSelectedPlaylist(playlist);
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null);
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  const handleRemoveVideo = (videoId: string) => {
    if (selectedPlaylist) {
      removeFromPlaylistMutation.mutate({
        playlistId: selectedPlaylist._id,
        videoId: videoId
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Playlists</h1>
        <p>Sign in to see your playlists</p>
      </div>
    );
  }

  // Show playlist details view
  if (selectedPlaylist) {
    const videos = playlistDetails?.videos || [];
    
    return (
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToPlaylists}
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Playlists
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{selectedPlaylist.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </p>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video: any) => (
              <div key={video._id} className="relative group">
                <div onClick={() => handleVideoClick(video._id)} className="cursor-pointer">
                  <VideoCard video={video} />
                </div>
                
                {/* Remove from playlist button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveVideo(video._id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-black/90 text-white p-1 h-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-medium mb-2">No videos in this playlist</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Add videos to this playlist to see them here.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show playlists list view
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Playlists</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Playlist</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Playlist title"
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
              />
              <Button 
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistTitle.trim()}
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {playlists.map((playlist: any) => (
            <div 
              key={playlist._id} 
              className="bg-card rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
              onClick={() => handlePlaylistClick(playlist)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                    <path d="M12 11v4"/>
                    <path d="M10 13h4"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{playlist.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {playlist.videos?.length || 0} video{(playlist.videos?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
                View playlist
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-medium mb-2">No playlists yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first playlist to organize your favorite videos.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            Create Your First Playlist
          </Button>
        </div>
      )}
    </div>
  );
}
