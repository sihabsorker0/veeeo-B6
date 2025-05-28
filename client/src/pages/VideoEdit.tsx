
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContextFixed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft, Save, Upload, X } from "lucide-react";

export default function VideoEdit() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  // Get video data
  const { data: videoData, isLoading } = useQuery({
    queryKey: [`/api/videos/${id}`],
    enabled: !!id && isAuthenticated
  });

  const video = videoData?.video;

  // Initialize form data when video loads
  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
      setTags(video.tags ? video.tags.join(", ") : "");
      setThumbnailPreview(video.thumbnailUrl || "");
    }
  }, [video]);

  // Check if user owns this video
  useEffect(() => {
    if (video && user && video.user?._id !== user._id) {
      toast({
        title: "Access denied",
        description: "You can only edit your own videos",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [video, user]);

  // Update video mutation
  const updateVideoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to update video');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${id}`] });
      toast({
        title: "Video updated",
        description: "Your video has been updated successfully.",
      });
      navigate(`/video/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating the video",
        variant: "destructive",
      });
    }
  });

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    
    // Process tags
    const processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    formData.append('tags', JSON.stringify(processedTags));
    
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    updateVideoMutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate(`/video/${id}`);
  };

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Video Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The video you're trying to edit doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Video</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Video</h1>
              <p className="text-gray-600 dark:text-gray-400">Update your video information</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={video.videoUrl}
                      poster={thumbnailPreview}
                      controls
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter video title"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter video description"
                      className="mt-1"
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Enter tags separated by commas (e.g., gaming, tutorial, fun)"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple tags with commas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Thumbnail */}
              <Card>
                <CardHeader>
                  <CardTitle>Thumbnail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">No thumbnail</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="thumbnail">Upload New Thumbnail</Label>
                    <Input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 1280x720 pixels (16:9 ratio)
                    </p>
                  </div>

                  {thumbnailFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailPreview(video.thumbnailUrl || "");
                      }}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Thumbnail Change
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Video Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Views:</span>
                    <span className="font-medium">{video.views || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Likes:</span>
                    <span className="font-medium">{video.likes || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium">{video.duration || '0:00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Uploaded:</span>
                    <span className="font-medium">
                      {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateVideoMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateVideoMutation.isPending || !title.trim()}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>
                {updateVideoMutation.isPending ? "Saving..." : "Save Changes"}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
