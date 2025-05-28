import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, Trash2, CheckCircle, UserX, Search, Filter, Calendar
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { apiRequest } from "@/lib/queryClient";
import ImprovedAdminSidebar from "@/components/ImprovedAdminSidebar";
import ImprovedAdminHeader from "@/components/ImprovedAdminHeader";
import "@/styles/admin.css";

interface Comment {
  _id: string;
  content: string;
  userId: string;
  videoId: string;
  likes: number;
  createdAt: string;
  username?: string;
  videoTitle?: string;
}

export default function AdminComments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for comment deletion
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Query for comments
  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/admin/comments"],
    queryFn: async () => {
      const response = await fetch('/api/admin/comments');
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return response.json();
    }
  });
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/comments/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      
      toast({
        title: "Success",
        description: "Comment has been deleted.",
      });
      
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete comment: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const handleDeleteComment = (comment: Comment) => {
    setSelectedComment(comment);
    setDeleteDialogOpen(true);
  };
  
  const handleSubmitDelete = () => {
    if (selectedComment) {
      deleteCommentMutation.mutate(selectedComment._id);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-layout">
        <ImprovedAdminSidebar />
        <div className="admin-content">
          <ImprovedAdminHeader 
            title="Comment Management" 
            subtitle="Loading comment data..."
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
          title="Comment Management" 
          subtitle="Moderate and manage user comments"
          onMobileMenuClick={() => {}}
        />
        
        <div className="main-container">
          <div className="admin-card">
            <div className="card-header">
              <div className="card-title">
                <MessageSquare className="card-title-icon h-5 w-5" />
                All Comments
              </div>
              <div className="card-actions">
                <div className="relative max-w-xs mr-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-[var(--admin-text-secondary)]" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search comments..." 
                    className="form-input w-full py-2 pl-10 pr-4 bg-opacity-50 text-sm"
                  />
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>COMMENT</th>
                      <th>USER</th>
                      <th>VIDEO</th>
                      <th>DATE</th>
                      <th className="text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comments?.map((comment) => (
                      <tr key={comment._id}>
                        <td>
                          <div className="truncate max-w-[300px] font-medium">{comment.content}</div>
                        </td>
                        <td>
                          <div className="text-[var(--admin-text-secondary)]">{comment.username || "Unknown"}</div>
                        </td>
                        <td>
                          <div className="text-[var(--admin-text-secondary)] truncate max-w-[150px]">{comment.videoTitle || "Unknown Video"}</div>
                        </td>
                        <td>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-[var(--admin-text-secondary)]" />
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              onClick={() => handleDeleteComment(comment)} 
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
                    {(!comments || comments.length === 0) && (
                      <tr>
                        <td colSpan={5}>
                          <div className="flex flex-col items-center justify-center py-12">
                            <MessageSquare className="h-16 w-16 text-[var(--admin-text-muted)] mb-4" />
                            <p className="text-[var(--admin-text-secondary)] mb-4">No comments found</p>
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
        
        {/* Comment Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="dialog-content">
            <AlertDialogHeader>
              <AlertDialogTitle className="dialog-title">Delete Comment</AlertDialogTitle>
              <AlertDialogDescription className="dialog-description">
                Are you sure you want to delete this comment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="bg-[var(--admin-hover-bg)] p-4 rounded-md my-4 border border-[var(--admin-border)]">
              <p className="text-[var(--admin-text-primary)]">{selectedComment?.content}</p>
            </div>
            <AlertDialogFooter className="dialog-footer">
              <AlertDialogCancel className="admin-button button-outline">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmitDelete}
                disabled={deleteCommentMutation.isPending}
                className="admin-button button-danger"
              >
                {deleteCommentMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete Comment"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}