import { useState, useRef } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { uploadVideo, uploadThumbnail } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContextFixed";
import { queryClient } from "@/lib/queryClient";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      if (file.type.includes('video/')) {
        setVideoFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a video file",
          variant: "destructive"
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload videos",
        variant: "destructive"
      });
      return;
    }

    if (!videoFile) {
      toast({
        title: "No video selected",
        description: "Please select a video file to upload",
        variant: "destructive"
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your video",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      let thumbnailUrl = "";

      // Upload thumbnail if present
      if (thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append("thumbnail", thumbnailFile);
        
        const thumbnailResponse = await uploadThumbnail(thumbnailFormData);
        thumbnailUrl = thumbnailResponse.thumbnailUrl;
      }

      // Upload video
      const videoFormData = new FormData();
      videoFormData.append("video", videoFile);
      videoFormData.append("title", title);
      videoFormData.append("description", description);
      videoFormData.append("category", category);
      videoFormData.append("tags", tags);
      
      if (thumbnailUrl) {
        videoFormData.append("thumbnailUrl", thumbnailUrl);
      }

      const response = await uploadVideo(videoFormData);

      toast({
        title: "Upload successful",
        description: "Your video has been uploaded successfully",
      });

      // Reset form and close modal
      resetForm();
      
      // Invalidate videos query to show the new video
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your video",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setTags("");
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Upload Video</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 my-2">
          {!videoFile ? (
            <div 
              className="mb-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <i className="ri-upload-cloud-line text-4xl text-gray-400 dark:text-gray-500 mb-2"></i>
              <p className="mb-2">Drag and drop video files to upload</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Or</p>
              <Button 
                onClick={() => videoInputRef.current?.click()}
                className="bg-accent text-white hover:bg-accent/90"
              >
                Select File
                <input 
                  ref={videoInputRef}
                  type="file" 
                  className="hidden" 
                  accept="video/*" 
                  onChange={handleVideoChange}
                />
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Supported formats: MP4, MOV, AVI, etc.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <i className="ri-film-line text-xl text-primary mr-2"></i>
                <span className="flex-1 truncate">{videoFile.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setVideoFile(null);
                    if (videoInputRef.current) videoInputRef.current.value = "";
                  }}
                >
                  <i className="ri-close-line"></i>
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter video description"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="cooking">Cooking</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="comedy">Comedy</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Tags</Label>
                  <Input 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Add tags separated by commas"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Thumbnail</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center mt-1">
                    {thumbnailPreview ? (
                      <div className="relative">
                        <img 
                          src={thumbnailPreview} 
                          alt="Thumbnail preview" 
                          className="max-h-32 mx-auto rounded"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-0 right-0 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                          onClick={() => {
                            setThumbnailFile(null);
                            setThumbnailPreview(null);
                            if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
                          }}
                        >
                          <i className="ri-close-line"></i>
                        </Button>
                      </div>
                    ) : (
                      <>
                        <i className="ri-image-line text-2xl text-gray-400 dark:text-gray-500 mb-1"></i>
                        <p className="text-sm mb-2">Upload thumbnail image</p>
                        <Button 
                          variant="outline"
                          onClick={() => thumbnailInputRef.current?.click()}
                          className="text-sm"
                          size="sm"
                        >
                          Select Image
                          <input 
                            ref={thumbnailInputRef}
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleThumbnailChange}
                          />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!videoFile || !title.trim() || isUploading}
            className="bg-primary text-white hover:bg-red-600"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
