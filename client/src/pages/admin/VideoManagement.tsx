import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Video, Edit, Trash2
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

interface Video {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  views: number;
  likes: number;
  dislikes: number;
  duration?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
}

export default function VideoManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for video editing/deleting
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [deleteVideoDialogOpen, setDeleteVideoDialogOpen] = useState(false);
  
  // Query for videos
  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/admin/videos"],
  });
  
  // Video mutations
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/videos/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      
      toast({
        title: "Success",
        description: `Video "${selectedVideo?.title}" has been deleted.`,
      });
      
      setDeleteVideoDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete video: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const updateVideoMutation = useMutation({
    mutationFn: async (data: { id: string, title: string, description?: string }) => {
      return apiRequest(`/api/videos/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          title: data.title,
          description: data.description
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
      
      toast({
        title: "Success",
        description: `Video "${selectedVideo?.title}" has been updated.`,
      });
      
      setVideoDialogOpen(false);
      setVideoTitle("");
      setVideoDescription("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update video: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const handleEditVideo = (video: Video) => {
    setSelectedVideo(video);
    setVideoTitle(video.title);
    setVideoDescription(video.description || "");
    setVideoDialogOpen(true);
  };
  
  const handleDeleteVideo = (video: Video) => {
    setSelectedVideo(video);
    setDeleteVideoDialogOpen(true);
  };
  
  const handleSubmitVideoEdit = () => {
    if (selectedVideo) {
      updateVideoMutation.mutate({
        id: selectedVideo._id,
        title: videoTitle,
        description: videoDescription
      });
    }
  };
  
  const handleSubmitVideoDelete = () => {
    if (selectedVideo) {
      deleteVideoMutation.mutate(selectedVideo._id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-6 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Video Management</CardTitle>
            <p className="text-gray-400">Manage all videos on the platform.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-gray-700 text-gray-300">
              {videos?.length || 0} Videos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-400 pb-2 border-b border-gray-700">
              <span>TITLE</span>
              <span>VIEWS</span>
              <span>LIKES</span>
              <span>CATEGORY</span>
              <span>DATE</span>
              <span>ACTIONS</span>
            </div>
            {videos?.map((video) => (
              <div key={video._id} className="grid grid-cols-6 gap-4 py-3 border-b border-gray-800 last:border-0">
                <div className="text-white font-medium truncate">{video.title}</div>
                <div className="text-gray-400">{video.views}</div>
                <div className="text-gray-400">{video.likes}</div>
                <div className="text-gray-400">{video.category || "Uncategorized"}</div>
                <div className="text-gray-400">{new Date(video.createdAt).toLocaleDateString()}</div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleEditVideo(video)} 
                    variant="outline" 
                    size="sm" 
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDeleteVideo(video)} 
                    variant="outline" 
                    size="sm" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-400">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No videos found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Edit Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Video</DialogTitle>
            <DialogDescription className="text-gray-400">
              Make changes to the video information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="videoTitle" className="text-sm font-medium text-gray-300">
                Title
              </label>
              <Input
                id="videoTitle"
                placeholder="Video title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="videoDescription" className="text-sm font-medium text-gray-300">
                Description
              </label>
              <Textarea
                id="videoDescription"
                placeholder="Video description"
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVideoDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitVideoEdit}
              disabled={updateVideoMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateVideoMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Video Delete Confirmation */}
      <AlertDialog open={deleteVideoDialogOpen} onOpenChange={setDeleteVideoDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Video</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{selectedVideo?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitVideoDelete}
              disabled={deleteVideoMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteVideoMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                "Delete Video"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}