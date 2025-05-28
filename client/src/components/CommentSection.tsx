import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContextFixed";
import { getInitials, formatTimeAgo } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { addComment, deleteComment, likeComment, dislikeComment, replyToComment } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CommentSectionProps {
  videoId: string;
}

export default function CommentSection({ videoId }: CommentSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: commentsData, isLoading, error } = useQuery({
    queryKey: [`/api/videos/${videoId}/comments`],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      return data || { comments: [] };
    },
    retry: 1,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true
  });

  const comments = Array.isArray(commentsData?.comments) ? commentsData.comments : [];

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: () => addComment(videoId, commentText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/comments`] });
      setCommentText("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add comment",
        description: error.message || "There was an error adding your comment",
        variant: "destructive",
      });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/comments`] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete comment",
        description: error.message || "There was an error deleting your comment",
        variant: "destructive",
      });
    }
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/comments`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to like comment",
        description: error.message || "There was an error liking the comment",
        variant: "destructive",
      });
    }
  });

  // Dislike comment mutation
  const dislikeCommentMutation = useMutation({
    mutationFn: (commentId: string) => dislikeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/comments`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to dislike comment",
        description: error.message || "There was an error disliking the comment",
        variant: "destructive",
      });
    }
  });

  // Reply to comment mutation
  const replyCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => 
      replyToComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/comments`] });
      setReplyingTo(null);
      setReplyText("");
      toast({
        title: "Reply added",
        description: "Your reply has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add reply",
        description: error.message || "There was an error adding your reply",
        variant: "destructive",
      });
    }
  });

  const handleSubmitComment = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add a comment",
        variant: "destructive",
      });
      return;
    }

    if (!commentText.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate();
  };

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  const handleLikeComment = (commentId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like a comment",
        variant: "destructive",
      });
      return;
    }

    likeCommentMutation.mutate(commentId);
  };

  const handleDislikeComment = (commentId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to dislike a comment",
        variant: "destructive",
      });
      return;
    }

    dislikeCommentMutation.mutate(commentId);
  };

  const handleReplyToComment = (commentId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to reply to a comment",
        variant: "destructive",
      });
      return;
    }

    if (!replyText.trim()) {
      toast({
        title: "Empty reply",
        description: "Please enter a reply",
        variant: "destructive",
      });
      return;
    }

    replyCommentMutation.mutate({ commentId, content: replyText });
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Unable to load comments. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="font-medium">Comments ({comments.length})</h3>

      {/* Add comment */}
      <div className="flex mt-4">
        {isAuthenticated ? (
          <>
            <Avatar className="h-8 w-8 mr-3">
              {user?.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.username} />
              ) : (
                <AvatarFallback>{getInitials(user?.username || "")}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[60px] resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={() => setCommentText("")}
                  variant="ghost"
                  size="sm"
                  className="mr-2"
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  size="sm"
                >
                  {addCommentMutation.isPending ? "Commenting..." : "Comment"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="mb-3">Please sign in to add a comment</p>
            <Button onClick={() => {
              // For testing purposes, log in with a test account
              const testCredentials = {
                username: 'testuser',
                password: 'password123'
              };

              fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(testCredentials),
                credentials: 'include'
              })
              .then(response => {
                if (response.ok) {
                  return response.json();
                }
                throw new Error('Login failed');
              })
              .then(data => {
                toast({
                  title: "Logged in successfully",
                  description: `Welcome back, ${data.user.username}!`,
                });
                // Refresh the page to update auth state
                window.location.reload();
              })
              .catch(error => {
                toast({
                  title: "Login failed",
                  description: error.message || "Invalid username or password",
                  variant: "destructive",
                });
              });
            }}>
              Sign In (Test Account)
            </Button>
          </div>
        )}
      </div>

      {/* Comment List */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <div className="flex" key={index}>
              <Skeleton className="h-8 w-8 rounded-full mr-3" />
              <div className="flex-1">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-32 mr-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-full mt-1" />
                <div className="flex items-center mt-2">
                  <Skeleton className="h-4 w-12 mr-4" />
                  <Skeleton className="h-4 w-12 mr-4" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
          ))
        ) : comments.length > 0 ? (
          <>
            {comments.filter((comment: any) => comment && typeof comment === 'object').map((comment: any) => (
              <div className="flex" key={comment._id}>
                <Avatar className="h-8 w-8 mr-3">
                  {comment.user?.avatarUrl ? (
                    <AvatarImage src={comment.user.avatarUrl} alt={comment.user.username} />
                  ) : (
                    <AvatarFallback>{getInitials(comment.user?.username || "")}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <h4 className="font-medium text-sm">{comment.user?.username || "Unknown User"}</h4>
                      <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">{formatTimeAgo(comment.createdAt)}</span>
                    </div>

                    {isAuthenticated && (user?._id === comment.userId || user?._id === comment.user?._id) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <i className="ri-more-line"></i>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <i className="ri-delete-bin-line mr-2"></i>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                  <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <button 
                      className="flex items-center mr-4 hover:text-blue-500"
                      onClick={() => handleLikeComment(comment._id)}
                    >
                      <i className="ri-thumb-up-line mr-1"></i>
                      <span>{comment.likes || 0}</span>
                    </button>
                    <button 
                      className="flex items-center mr-4 hover:text-red-500"
                      onClick={() => handleDislikeComment(comment._id)}
                    >
                      <i className="ri-thumb-down-line mr-1"></i>
                      <span>{comment.dislikes || 0}</span>
                    </button>
                    <button 
                      className="hover:text-blue-500"
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                    >
                      Reply
                    </button>
                  </div>

                  {/* Reply Section */}
                  {replyingTo === comment._id && (
                    <div className="mt-3 ml-8">
                      <div className="flex">
                        <Avatar className="h-6 w-6 mr-2">
                          {user?.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                          ) : (
                            <AvatarFallback>{getInitials(user?.username || "")}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Add a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="min-h-[50px] resize-none text-sm"
                          />
                          <div className="flex justify-end mt-2">
                            <Button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                              variant="ghost"
                              size="sm"
                              className="mr-2"
                              disabled={replyCommentMutation.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleReplyToComment(comment._id)}
                              disabled={!replyText.trim() || replyCommentMutation.isPending}
                              size="sm"
                            >
                              {replyCommentMutation.isPending ? "Replying..." : "Reply"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-8 space-y-3">
                      {comment.replies.map((reply: any) => (
                        <div className="flex" key={reply._id}>
                          <Avatar className="h-6 w-6 mr-2">
                            {reply.user?.avatarUrl ? (
                              <AvatarImage src={reply.user.avatarUrl} alt={reply.user.username} />
                            ) : (
                              <AvatarFallback>{getInitials(reply.user?.username || "")}</AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <h5 className="font-medium text-xs">{reply.user?.username || "Unknown User"}</h5>
                                <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">{formatTimeAgo(reply.createdAt)}</span>
                              </div>
                              {isAuthenticated && (user?._id === reply.userId || user?._id === reply.user?._id) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-4 w-4">
                                      <i className="ri-more-line text-xs"></i>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteComment(reply._id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <i className="ri-delete-bin-line mr-2"></i>
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            <p className="text-xs mt-1">{reply.content}</p>
                            <div className="flex items-center mt-1 text-xs text-gray-600 dark:text-gray-400">
                              <button 
                                className="flex items-center mr-3 hover:text-blue-500"
                                onClick={() => handleLikeComment(reply._id)}
                              >
                                <i className="ri-thumb-up-line mr-1"></i>
                                <span>{reply.likes || 0}</span>
                              </button>
                              <button 
                                className="flex items-center mr-3 hover:text-red-500"
                                onClick={() => handleDislikeComment(reply._id)}
                              >
                                <i className="ri-thumb-down-line mr-1"></i>
                                <span>{reply.dislikes || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {comments.length > 3 && (
              <Button 
                variant="link" 
                className="text-blue-500 dark:text-blue-400 p-0 h-auto"
                onClick={() => setShowAllComments(!showAllComments)}
              >
                {showAllComments ? "Show fewer comments" : `Show more comments (${comments.length - 3})`}
              </Button>
            )}
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}