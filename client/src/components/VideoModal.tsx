import {
  Dialog,
  DialogContent,
  DialogOverlay
} from "@/components/ui/dialog";
import VideoPlayer from "@/components/VideoPlayer";
import CommentSection from "@/components/CommentSection";
import AdDisplay from "@/components/AdDisplay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatNumber, formatTimeAgo, getInitials } from "@/lib/utils";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { likeVideo, subscribeToChannel, unsubscribeFromChannel } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: any;
}

export default function VideoModal({ isOpen, onClose, video }: VideoModalProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  if (!video) return null;
  
  const {
    _id,
    title,
    description,
    thumbnailUrl,
    videoUrl,
    views,
    likes,
    dislikes,
    createdAt,
    user: videoUser,
    likeStatus,
    isSubscribed
  } = video;
  
  // Like video mutation
  const likeMutation = useMutation({
    mutationFn: (action: 'like' | 'dislike' | 'none') => likeVideo(_id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${_id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Action failed",
        description: error.message || "There was an error processing your action",
        variant: "destructive",
      });
    }
  });
  
  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: () => isSubscribed 
      ? unsubscribeFromChannel(videoUser._id) 
      : subscribeToChannel(videoUser._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${_id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/subscriptions'] });
      toast({
        title: isSubscribed ? "Unsubscribed" : "Subscribed",
        description: isSubscribed 
          ? `You have unsubscribed from ${videoUser.username}` 
          : `You have subscribed to ${videoUser.username}`,
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
  
  const isOwnVideo = isAuthenticated && user?._id === videoUser?._id;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/90" />
      <DialogContent className="bg-transparent border-none shadow-none max-w-4xl p-4">
        <div className="bg-white dark:bg-darkCard rounded-lg overflow-hidden">
          {/* Video Player with Ad Overlay */}
          <div className="relative">
            <VideoPlayer 
              videoUrl={videoUrl} 
              title={title} 
              views={views} 
              thumbnailUrl={thumbnailUrl} 
            />
            <AdDisplay type="overlay" />
          </div>
          
          {/* Video Info */}
          <div className="p-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {formatNumber(views)} views • {formatTimeAgo(createdAt)}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost"
                  onClick={() => handleLike(likeStatus === 'like' ? 'none' : 'like')}
                  className={likeStatus === 'like' ? 'text-primary' : ''}
                >
                  <i className={`${likeStatus === 'like' ? 'ri-thumb-up-fill' : 'ri-thumb-up-line'} mr-1`}></i>
                  <span>{formatNumber(likes)}</span>
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => handleLike(likeStatus === 'dislike' ? 'none' : 'dislike')}
                  className={likeStatus === 'dislike' ? 'text-primary' : ''}
                >
                  <i className={`${likeStatus === 'dislike' ? 'ri-thumb-down-fill' : 'ri-thumb-down-line'} mr-1`}></i>
                  <span>{formatNumber(dislikes)}</span>
                </Button>
                <Button variant="ghost">
                  <i className="ri-share-forward-line mr-1"></i>
                  <span>Share</span>
                </Button>
              </div>
            </div>
            
            {/* Channel Info */}
            <div className="flex items-center mt-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Avatar className="h-10 w-10 mr-3">
                {videoUser?.avatarUrl ? (
                  <AvatarImage src={videoUser.avatarUrl} alt={videoUser.username} />
                ) : (
                  <AvatarFallback>{getInitials(videoUser?.username || "")}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium">{videoUser?.username || "Unknown Channel"}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {formatNumber(videoUser?.subscribers || 0)} subscribers
                </p>
              </div>
              {!isOwnVideo && (
                <Button
                  onClick={handleSubscribe}
                  className={isSubscribed 
                    ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100" 
                    : "bg-primary text-white hover:bg-primary/90"}
                  disabled={subscribeMutation.isPending}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </Button>
              )}
            </div>
            
            {/* Description */}
            {description && (
              <div className="mt-4 text-sm">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                  {showFullDescription ? description : `${description.slice(0, 150)}${description.length > 150 ? '...' : ''}`}
                </p>
                {description.length > 150 && (
                  <Button 
                    variant="link" 
                    onClick={() => setShowFullDescription(!showFullDescription)} 
                    className="text-blue-500 dark:text-blue-400 p-0 h-auto"
                  >
                    {showFullDescription ? "Show less" : "Show more"}
                  </Button>
                )}
              </div>
            )}
            
            {/* Mid-roll Ad */}
            <div className="my-6">
              <AdDisplay type="mid-roll" />
            </div>
            
            {/* Comments Section */}
            <CommentSection videoId={_id} />
            
            {/* Post-roll Ad */}
            <div className="mt-6">
              <AdDisplay type="post-roll" />
            </div>
          </div>
        </div>
        
        <Button 
          className="absolute top-4 right-4 bg-black/50 text-white rounded-full hover:bg-black/70"
          size="icon"
          variant="ghost"
          onClick={onClose}
        >
          <i className="ri-close-line text-xl"></i>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
