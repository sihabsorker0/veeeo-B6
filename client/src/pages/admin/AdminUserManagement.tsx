import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, Ban, CheckCircle, Filter, DownloadCloud, Search, PlusCircle
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
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import ImprovedAdminSidebar from "@/components/ImprovedAdminSidebar";
import ImprovedAdminHeader from "@/components/ImprovedAdminHeader";
import "@/styles/admin.css";

interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  subscribers: number;
  isBanned?: boolean;
  banReason?: string;
  createdAt: string;
}

export default function AdminUserManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for user banning
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  
  // Query for users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async (data: { id: string, isBanned: boolean, banReason?: string }) => {
      return apiRequest(`/api/admin/users/${data.id}/ban`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          isBanned: data.isBanned,
          banReason: data.banReason
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      
      toast({
        title: "Success",
        description: selectedUser?.isBanned 
          ? `User ${selectedUser?.username} has been unbanned.`
          : `User ${selectedUser?.username} has been banned.`,
      });
      
      setBanDialogOpen(false);
      setBanReason("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user ban status: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const handleBanUser = (user: User) => {
    setSelectedUser(user);
    setBanReason(user.banReason || "");
    setBanDialogOpen(true);
  };
  
  const handleSubmitBan = () => {
    if (selectedUser) {
      banUserMutation.mutate({
        id: selectedUser._id,
        isBanned: !selectedUser.isBanned,
        banReason: banReason
      });
    }
  };

  if (isLoading) {
    return (
      <div className="admin-layout">
        <ImprovedAdminSidebar />
        <div className="admin-content">
          <ImprovedAdminHeader 
            title="User Management" 
            subtitle="Loading user data..."
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
          title="User Management" 
          subtitle="Manage users and their permissions"
          onMobileMenuClick={() => {}}
          actions={
            <Button className="admin-button button-primary">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add User
            </Button>
          }
        />
        
        <div className="main-container">
          <div className="admin-card">
            <div className="card-header">
              <div className="card-title">
                <Users className="card-title-icon h-5 w-5" />
                All Users
              </div>
              <div className="card-actions">
                <div className="relative max-w-xs mr-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-[var(--admin-text-secondary)]" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search users..." 
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
                      <th>USERNAME</th>
                      <th>EMAIL</th>
                      <th>SUBSCRIBERS</th>
                      <th>STATUS</th>
                      <th>JOINED</th>
                      <th className="text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-cell">
                            <div className="table-avatar">
                              <span>{user.username.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="user-cell-info">
                              <div className="user-cell-name">{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.subscribers.toLocaleString()}</td>
                        <td>
                          {user.isBanned ? (
                            <Badge className="status-badge status-banned">
                              <Ban className="h-3 w-3 mr-1" />
                              Banned
                            </Badge>
                          ) : (
                            <Badge className="status-badge status-active">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            {user.isBanned ? (
                              <Button 
                                onClick={() => handleBanUser(user)} 
                                variant="ghost" 
                                size="sm" 
                                className="button-small button-success"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Unban
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => handleBanUser(user)} 
                                variant="ghost" 
                                size="sm" 
                                className="button-small button-danger"
                              >
                                <Ban className="h-3 w-3 mr-1" />
                                Ban
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!users || users.length === 0) && (
                      <tr>
                        <td colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-12">
                            <Users className="h-16 w-16 text-[var(--admin-text-muted)] mb-4" />
                            <p className="text-[var(--admin-text-secondary)] mb-4">No users found</p>
                            <Button className="admin-button button-primary">
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Add First User
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
        
        {/* User Ban Dialog */}
        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent className="dialog-content">
            <DialogHeader>
              <DialogTitle className="dialog-title">
                {selectedUser?.isBanned ? "Unban User" : "Ban User"}
              </DialogTitle>
              <DialogDescription className="dialog-description">
                {selectedUser?.isBanned
                  ? `Are you sure you want to unban ${selectedUser?.username}?`
                  : `Are you sure you want to ban ${selectedUser?.username}? This will prevent them from accessing most platform features.`}
              </DialogDescription>
            </DialogHeader>
            
            {!selectedUser?.isBanned && (
              <div className="space-y-4 py-4">
                <div className="form-group">
                  <label htmlFor="banReason" className="form-label">
                    Ban Reason <span className="text-[var(--admin-text-muted)]">(optional)</span>
                  </label>
                  <Textarea
                    id="banReason"
                    placeholder="Why are you banning this user?"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="form-input form-textarea"
                  />
                </div>
              </div>
            )}
            
            <DialogFooter className="dialog-footer">
              <Button
                variant="outline"
                onClick={() => setBanDialogOpen(false)}
                className="admin-button button-outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitBan}
                disabled={banUserMutation.isPending}
                className={`admin-button ${selectedUser?.isBanned ? 'button-success' : 'button-danger'}`}
              >
                {banUserMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : selectedUser?.isBanned ? (
                  "Unban User"
                ) : (
                  "Ban User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}