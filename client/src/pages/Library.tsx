import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContextFixed";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatNumber, formatTimeAgo } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Clock, Heart, PlaySquare, User, Video, Edit, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Library() {
  const { isAuthenticated, user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [deleteVideoDialogOpen, setDeleteVideoDialogOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Library</h1>
              <p className="text-gray-600 dark:text-gray-400">Sign in to access your personal collection</p>
            </div>
            <Button 
              onClick={() => navigate("/")}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const libraryItems = [
    {
      href: "/history",
      title: "Watch History",
      description: "Videos you've recently watched",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      count: null,
      color: "bg-blue-500"
    },
    {
      href: "/watch-later",
      title: "Watch Later",
      description: "Videos saved for later viewing",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
      count: null,
      color: "bg-yellow-500"
    },
    {
      href: "/liked-videos",
      title: "Liked Videos",
      description: "Videos you've given a thumbs up",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 0 00-6.364 0z" />
        </svg>
      ),
      count: null,
      color: "bg-red-500"
    },
    {
      href: "/playlists",
      title: "Your Playlists",
      description: "Custom collections you've created",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      count: null,
      color: "bg-purple-500"
    }
  ];

  const { data: userVideos, isLoading } = useQuery({
    queryKey: ['/api/users', user?._id, 'videos'],
    enabled: isAuthenticated,
    // queryFn: () => fetch(`/api/users/${user?._id}/videos`).then(res => res.json())
  });

  const { data: likedVideos, isLoading: likedLoading } = useQuery({
    queryKey: ['/api/liked-videos'],
    enabled: isAuthenticated,
  });

  

  const deleteVideoMutation = useMutation({
    mutationFn: (videoId: string) => 
      fetch(`/api/videos/${videoId}`, {
        method: 'DELETE'
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?._id, 'videos'] });
      toast({
        title: "Video deleted",
        description: "Your video has been moved to trash. You can restore it within 15 days.",
      });
      setDeleteVideoDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "There was an error deleting the video",
        variant: "destructive",
      });
    }
  });

  const handleEditVideo = (video: any) => {
    navigate(`/video/${video._id}/edit`);
  };

  const handleDeleteVideo = (video: any) => {
    setSelectedVideo(video);
    setDeleteVideoDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Library</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user?.username || 'User'}! Your personal video collection awaits.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {libraryItems.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${item.color} text-white mr-3`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.count || "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-8" />

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Your Videos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoading ? (
            // Show skeleton loaders while loading
            [...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-36 w-full rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          ) : (
            // Display user's videos
            <>
              {userVideos?.videos?.map((video: any) => (
                <div
                  key={video._id}
                  className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div 
                    className="aspect-video relative cursor-pointer"
                    onClick={() => navigate(`/video/${video._id}`)}
                  >
                    <img
                      src={video.thumbnailUrl || '/placeholder-thumbnail.jpg'}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {video.duration || '0:00'}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 
                      className="font-semibold text-sm line-clamp-2 mb-1 text-gray-900 dark:text-gray-100 cursor-pointer"
                      onClick={() => navigate(`/video/${video._id}`)}
                    >
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {formatNumber(video.views)} views • {formatTimeAgo(video.createdAt)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditVideo(video);
                        }}
                        className="text-xs h-7"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVideo(video);
                        }}
                        className="text-xs h-7 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )) || []}
            </>
          )}
        </div>

        {/* Library Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-12">
          {libraryItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-0 shadow-md bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl ${item.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {item.title}
                        </h3>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-3 flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.count || "View All"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-gray-800 dark:to-gray-700 border-red-200 dark:border-gray-600">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-500 text-white rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Access</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Continue watching or discover something new from your collections
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      

      {/* Delete Video Dialog */}
      <Dialog open={deleteVideoDialogOpen} onOpenChange={setDeleteVideoDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setDeleteVideoDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              onClick={() => {
                deleteVideoMutation.mutate(selectedVideo._id);
              }}
              isLoading={deleteVideoMutation.isLoading}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}