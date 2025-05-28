import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import VideoPlayer from "@/components/VideoPlayer";
import CommentSection from "@/components/CommentSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatTimeAgo, getInitials } from "@/lib/utils";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContextFixed";
import { queryClient } from "@/lib/queryClient";
import { likeVideo, subscribeToChannel, unsubscribeFromChannel, addToWatchLater, removeFromWatchLater } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import VideoCard from "@/components/VideoCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [viewIncremented, setViewIncremented] = useState(false);
  const [deleteVideoDialogOpen, setDeleteVideoDialogOpen] = useState(false);
  const [editVideoDialogOpen, setEditVideoDialogOpen] = useState(false);

  // Regular video data query without view increment
  const { data: videoData, isLoading, error } = useQuery({
    queryKey: [`/api/videos/${id}`],
    refetchInterval: 3000, // Poll every 3 seconds
    enabled: !!id
  });

  // Separate query that only runs once to increment the view count
  const viewCountQuery = useQuery({
    queryKey: [`/api/videos/${id}/increment-view`],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${id}?increment_view=true`);
      if (!response.ok) {
        throw new Error('Failed to increment view');
      }
      return response.json();
    },
    enabled: !!id && !viewIncremented
  });

  // Mark view as incremented when the query completes
  if (viewCountQuery.isSuccess && !viewIncremented) {
    setViewIncremented(true);
  }

  const { data: recommendedData } = useQuery({
    queryKey: ['/api/videos', { recommended: true, excludeId: id }],
    enabled: !!id
  });

  const { data: playlists } = useQuery({
    queryKey: ['/api/playlists'],
    enabled: isAuthenticated
  });

  const video = videoData?.video;
  const recommendedVideos = recommendedData?.videos || [];

  // Existing mutations...
  const likeMutation = useMutation({
    mutationFn: (action: 'like' | 'dislike' | 'none') => likeVideo(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Action failed",
        description: error.message || "There was an error processing your action",
        variant: "destructive",
      });
    }
  });

  const subscribeMutation = useMutation({
    mutationFn: () => video.isSubscribed
      ? unsubscribeFromChannel(video.user._id)
      : subscribeToChannel(video.user._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/subscriptions'] });
      toast({
        title: video.isSubscribed ? "Unsubscribed" : "Subscribed",
        description: video.isSubscribed
          ? `You have unsubscribed from ${video.user.username}`
          : `You have subscribed to ${video.user.username}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Action failed",
        description: error.message || "There was an error processing your action",
        variant: "destructive",
      });
    }
  });

  const watchLaterMutation = useMutation({
    mutationFn: () => video.inWatchLater
      ? removeFromWatchLater(id)
      : addToWatchLater(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/watch-later'] });
      toast({
        title: video.inWatchLater ? "Removed from Watch Later" : "Added to Watch Later",
        description: video.inWatchLater
          ? "The video has been removed from your Watch Later playlist"
          : "The video has been added to your Watch Later playlist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Action failed",
        description: error.message || "There was an error processing your action",
        variant: "destructive",
      });
    }
  });

  const createPlaylistMutation = useMutation({
    mutationFn: (title: string) => fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setNewPlaylistTitle("");
      toast({
        title: "Playlist created",
        description: "Your new playlist has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Action failed",
        description: error.message || "There was an error creating the playlist",
        variant: "destructive",
      });
    }
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string, videoId: string }) => fetch(`/api/playlists/${playlistId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      toast({
        title: "Video added to playlist",
        description: "The video has been added to the playlist.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Action failed",
        description: error.message || "There was an error adding the video to the playlist",
        variant: "destructive",
      });
    }
  });



  const deleteVideoMutation = useMutation({
    mutationFn: () => 
      fetch(`/api/videos/${id}`, {
        method: 'DELETE'
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Video deleted",
        description: "Your video has been moved to trash. You can restore it within 15 days.",
      });
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "There was an error deleting the video",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
        <div className="lg:col-span-2">
          <Skeleton className="w-full aspect-video rounded-lg" />
          <div className="mt-4">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="w-40 h-24" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="p-8 text-center">
        <i className="ri-error-warning-line text-5xl text-red-500 mb-4"></i>
        <h2 className="text-2xl font-bold mb-2">Video Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The video you're looking for doesn't exist or may have been removed.
        </p>
        <Button onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </div>
    );
  }

  const handleLike = (action: 'like' | 'dislike' | 'none') => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like or dislike videos",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate(action);
  };

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to channels",
        variant: "destructive",
      });
      return;
    }
    subscribeMutation.mutate();
  };

  const handleWatchLater = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the Watch Later feature",
        variant: "destructive",
      });
      return;
    }
    watchLaterMutation.mutate();
  };

  const handleEditVideo = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to edit videos",
        variant: "destructive",
      });
      return;
    }
    if (video) {
      navigate(`/video/${id}/edit`);
    }
  };

  const handleDeleteVideo = () => {
    if (video) {
      setDeleteVideoDialogOpen(true);
    }
  };

  const isOwnVideo = isAuthenticated && user?._id === video.user?._id;

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 p-4">
        <div className="flex-1 min-w-0 max-w-full">
          {/* Video Player */}
          <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
            <VideoPlayer
              videoUrl={video.videoUrl}
              title={video.title}
              views={video.views}
              thumbnailUrl={video.thumbnailUrl}
            />
          </div>

          {/* Video Info */}
          <div className="mt-4">
            <h1 className="text-xl md:text-2xl font-bold">{video.title}</h1>
            <div className="flex justify-between items-center mt-2 mb-4">
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                {formatNumber(video.views)} views • {formatTimeAgo(video.createdAt)}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleLike(video.likeStatus === 'like' ? 'none' : 'like')}
                    className={`rounded-full px-4 py-2 flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${video.likeStatus === 'like' ? 'text-red-600 dark:text-red-500' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={video.likeStatus === 'like' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 10v12" />
                      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                    </svg>
                    <span className="hidden sm:inline">{formatNumber(video.likes || 0)}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => handleLike(video.likeStatus === 'dislike' ? 'none' : 'dislike')}
                    className={`rounded-full px-4 py-2 flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${video.likeStatus === 'dislike' ? 'text-red-600 dark:text-red-500' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={video.likeStatus === 'dislike' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-180">
                      <path d="M7 10v12" />
                      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                    </svg>
                    <span className="hidden sm:inline">{formatNumber(video.dislikes || 0)}</span>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="rounded-full px-4 py-2 flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span className="hidden sm:inline">Share</span>
                </Button>

                {/* Desktop-only Add to Playlist */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden md:flex rounded-full px-4 py-2 items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                        <path d="M12 11v4" />
                        <path d="M10 13h4" />
                      </svg>
                      <span>Add to Playlist</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add to Playlist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {playlists?.map((playlist: any) => (
                        <div
                          key={playlist._id}
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => {
                            if (!isAuthenticated) {
                              toast({
                                title: "Authentication required",
                                description: "Please sign in to add videos to playlists",
                                variant: "destructive",
                              });
                              return;
                            }
                            addToPlaylistMutation.mutate({ playlistId: playlist._id, videoId: id });
                          }}
                        >
                          <span>{playlist.title}</span>
                          <span className="text-sm text-gray-500">{playlist.videos?.length || 0} videos</span>
                        </div>
                      ))}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full">Create New Playlist</Button>
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
                              onClick={() => {
                                if (!isAuthenticated) {
                                  toast({
                                    title: "Authentication required",
                                    description: "Please sign in to create playlists",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                if (newPlaylistTitle.trim()) {
                                  createPlaylistMutation.mutate(newPlaylistTitle);
                                }
                              }}
                              disabled={!newPlaylistTitle.trim()}
                            >
                              Create
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Desktop-only Save Button */}
                <Button
                  variant="ghost"
                  onClick={handleWatchLater}
                  className={`hidden md:flex rounded-full px-4 py-2 items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${video.inWatchLater ? 'text-red-600 dark:text-red-500' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={video.inWatchLater ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Save</span>
                </Button>

                {/* Three Dot Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="rounded-full p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {/* Mobile-only Save option */}
                    <DropdownMenuItem 
                      onClick={handleWatchLater}
                      className="md:hidden flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={video.inWatchLater ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      {video.inWatchLater ? "Remove from Watch Later" : "Save to Watch Later"}
                    </DropdownMenuItem>

                    {/* Mobile-only Add to Playlist option */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="md:hidden flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                            <path d="M12 11v4" />
                            <path d="M10 13h4" />
                          </svg>
                          Add to Playlist
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add to Playlist</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {playlists?.map((playlist: any) => (
                            <div
                              key={playlist._id}
                              className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => {
                                if (!isAuthenticated) {
                                  toast({
                                    title: "Authentication required",
                                    description: "Please sign in to add videos to playlists",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                addToPlaylistMutation.mutate({ playlistId: playlist._id, videoId: id });
                              }}
                            >
                              <span>{playlist.title}</span>
                              <span className="text-sm text-gray-500">{playlist.videos?.length || 0} videos</span>
                            </div>
                          ))}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="w-full">Create New Playlist</Button>
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
                                  onClick={() => {
                                    if (!isAuthenticated) {
                                      toast({
                                        title: "Authentication required",
                                        description: "Please sign in to create playlists",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    if (newPlaylistTitle.trim()) {
                                      createPlaylistMutation.mutate(newPlaylistTitle);
                                    }
                                  }}
                                  disabled={!newPlaylistTitle.trim()}
                                >
                                  Create
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <DropdownMenuItem className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                      Report Video
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      Share Video
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      Show Transcript
                    </DropdownMenuItem>

                    {isOwnVideo && (
                      <>
                        <DropdownMenuItem 
                          onClick={handleEditVideo}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                          Edit Video
                        </DropdownMenuItem>

                        <DropdownMenuItem 
                          onClick={() => setDeleteVideoDialogOpen(true)}
                          className="flex items-center gap-2 text-red-600 dark:text-red-400 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="m19 6-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                            <path d="m10 11 0 6" />
                            <path d="m14 11 0 6" />
                            <path d="M5 6l1-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1l1 2" />
                          </svg>
                          Delete Video
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Channel Info */}
            <div className="border-t border-b border-gray-200 dark:border-gray-800 py-3">
              <div className="flex items-center">
                <Avatar 
                  className="h-10 w-10 mr-3 cursor-pointer"
                  onClick={() => navigate(`/channel/${video.user?._id}`)}
                >
                  {video.user?.avatarUrl ? (
                    <AvatarImage src={video.user.avatarUrl} alt={video.user.username} />
                  ) : (
                    <AvatarFallback>{getInitials(video.user?.username || "")}</AvatarFallback>
                  )}
                </Avatar>
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/channel/${video.user?._id}`)}
                >
                  <h3 className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {video.user?.username || "Unknown Channel"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {formatNumber(video.user?.subscribers || 0)} subscribers
                  </p>
                </div>
                {!isOwnVideo && (
                  <Button
                    onClick={handleSubscribe}
                    className={video.isSubscribed
                      ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-full"
                      : "bg-red-600 hover:bg-red-700 text-white rounded-full"}
                    disabled={subscribeMutation.isPending}
                  >
                    {video.isSubscribed ? "Subscribed" : "Subscribe"}
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                  {showFullDescription ? video.description : `${video.description.slice(0, 200)}${video.description.length > 200 ? '...' : ''}`}
                </div>
                {video.description.length > 200 && (
                  <Button
                    variant="link"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-red-600 dark:text-red-500 p-0 h-auto mt-2"
                  >
                    {showFullDescription ? "Show less" : "Show more"}
                  </Button>
                )}
                {video.tags && video.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {video.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comments Section */}
            <CommentSection videoId={video._id} />
          </div>
        </div>

        {/* Recommended Videos Sidebar */}
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <h3 className="font-semibold text-lg mb-4 px-2 text-gray-900 dark:text-gray-100">Up next</h3>
          <div className="space-y-2">
            {recommendedVideos.map((recommendedVideo: any) => (
              <VideoCard key={recommendedVideo._id} video={recommendedVideo} compact />
            ))}
          </div>
        </div>
      </div>



      {/* Delete Video Dialog */}
      <Dialog open={deleteVideoDialogOpen} onOpenChange={setDeleteVideoDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Delete Video</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete "{video?.title}"? This video will be moved to trash and can be restored within 15 days.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteVideoDialogOpen(false)}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteVideoMutation.mutate()}
              disabled={deleteVideoMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteVideoMutation.isPending ? "Deleting..." : "Delete Video"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}