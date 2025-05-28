import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Video, Edit, Trash2, Eye, ThumbsUp, Calendar, Search, Filter, Upload, DownloadCloud, Pencil
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
import ImprovedAdminSidebar from "@/components/ImprovedAdminSidebar";
import ImprovedAdminHeader from "@/components/ImprovedAdminHeader";
import "@/styles/admin.css";

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

export default function AdminVideoManagement() {
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
      <div className="admin-layout">
        <ImprovedAdminSidebar />
        <div className="admin-content">
          <ImprovedAdminHeader 
            title="Video Management" 
            subtitle="Loading video data..."
            onMobileMenuClick={() => {}}
          />
          <div className="main-container">
            <div className="animate-pulse">
              <div className="flex justify-between items-center mb-6">
                <div className="h-8 bg-[var(--admin-card-bg)] rounded-lg w-64"></div>
                <div className="h-8 bg-[var(--admin-card-bg)] rounded-lg w-32"></div>
              </div>
              <div className="admin-card">
                <div className="card-header">
                  <div className="w-40 h-6 bg-[var(--admin-hover-bg)] rounded-lg"></div>
                  <div className="flex gap-2">
                    <div className="w-24 h-8 bg-[var(--admin-hover-bg)] rounded-lg"></div>
                    <div className="w-24 h-8 bg-[var(--admin-hover-bg)] rounded-lg"></div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-[var(--admin-hover-bg)] rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <ImprovedAdminSidebar />
      <div className="admin-content">
        <ImprovedAdminHeader 
          title="Video Management" 
          subtitle="Manage videos and their metadata"
          onMobileMenuClick={() => {}}
          actions={
            <Button className="admin-button button-primary">
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          }
        />
        
        <div className="main-container">
          <div className="admin-card">
            <div className="card-header">
              <div className="card-title">
                <Video className="card-title-icon h-5 w-5" />
                All Videos
              </div>
              <div className="card-actions">
                <div className="relative max-w-xs mr-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-[var(--admin-text-secondary)]" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search videos..." 
                    className="form-input w-full py-2 pl-10 pr-4 bg-opacity-50 text-sm"
                  />
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <DownloadCloud className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>TITLE</th>
                      <th>VIEWS</th>
                      <th>LIKES</th>
                      <th>CATEGORY</th>
                      <th>DATE</th>
                      <th className="text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos?.map((video) => (
                      <tr key={video._id}>
                        <td>
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded bg-[var(--admin-active-bg)] flex items-center justify-center mr-3">
                              <Video className="h-5 w-5 text-[var(--admin-text-secondary)]" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-medium truncate max-w-[200px]">{video.title}</div>
                              {video.description && (
                                <div className="text-[var(--admin-text-secondary)] text-xs truncate max-w-[200px]">{video.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1 text-[var(--admin-text-secondary)]" />
                            {video.views.toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center">
                            <ThumbsUp className="h-4 w-4 mr-1 text-[var(--admin-text-secondary)]" />
                            {video.likes.toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <Badge className="status-badge status-secondary">
                            {video.category || "Uncategorized"}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-[var(--admin-text-secondary)]" />
                            {new Date(video.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              onClick={() => handleEditVideo(video)} 
                              variant="ghost" 
                              size="sm" 
                              className="button-small button-secondary"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              onClick={() => handleDeleteVideo(video)} 
                              variant="ghost" 
                              size="sm" 
                              className="button-small button-danger"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!videos || videos.length === 0) && (
                      <tr>
                        <td colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-12">
                            <Video className="h-16 w-16 text-[var(--admin-text-muted)] mb-4" />
                            <p className="text-[var(--admin-text-secondary)] mb-4">No videos found</p>
                            <Button className="admin-button button-primary">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload First Video
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* Video Edit Dialog */}
        <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
          <DialogContent className="dialog-content">
            <DialogHeader>
              <DialogTitle className="dialog-title">Edit Video</DialogTitle>
              <DialogDescription className="dialog-description">
                Make changes to the video information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="form-group">
                <label htmlFor="videoTitle" className="form-label">
                  Title
                </label>
                <Input
                  id="videoTitle"
                  placeholder="Video title"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="videoDescription" className="form-label">
                  Description
                </label>
                <Textarea
                  id="videoDescription"
                  placeholder="Video description"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="form-input form-textarea"
                />
              </div>
            </div>
            
            <DialogFooter className="dialog-footer">
              <Button
                variant="outline"
                onClick={() => setVideoDialogOpen(false)}
                className="admin-button button-outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitVideoEdit}
                disabled={updateVideoMutation.isPending}
                className="admin-button button-primary"
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
          <AlertDialogContent className="dialog-content">
            <AlertDialogHeader>
              <AlertDialogTitle className="dialog-title">Delete Video</AlertDialogTitle>
              <AlertDialogDescription className="dialog-description">
                Are you sure you want to delete "{selectedVideo?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="dialog-footer">
              <AlertDialogCancel className="admin-button button-outline">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmitVideoDelete}
                disabled={deleteVideoMutation.isPending}
                className="admin-button button-danger"
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
      </div>
    </div>
  );
}