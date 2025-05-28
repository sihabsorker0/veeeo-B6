import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, Ban, CheckCircle, Calendar
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

export default function UserManagement() {
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
            <CardTitle className="text-white">User Management</CardTitle>
            <p className="text-gray-400">Manage all users on the platform.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-gray-700 text-gray-300">
              {users?.length || 0} Users
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-400 pb-2 border-b border-gray-700">
              <span>USERNAME</span>
              <span>EMAIL</span>
              <span>SUBSCRIBERS</span>
              <span>STATUS</span>
              <span>JOINED</span>
              <span>ACTIONS</span>
            </div>
            {users?.map((user) => (
              <div key={user._id} className="grid grid-cols-6 gap-4 py-3 border-b border-gray-800 last:border-0">
                <div className="text-white font-medium truncate">{user.username}</div>
                <div className="text-gray-400 truncate">{user.email}</div>
                <div className="text-gray-400">{user.subscribers}</div>
                <div>
                  {user.isBanned ? (
                    <Badge variant="destructive" className="bg-red-900/30 text-red-400 hover:bg-red-900/40">
                      <Ban className="h-3 w-3 mr-1" />
                      Banned
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-900/30 text-green-400 hover:bg-green-900/40">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <div className="text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</div>
                <div className="flex gap-2">
                  {user.isBanned ? (
                    <Button 
                      onClick={() => handleBanUser(user)} 
                      variant="outline" 
                      size="sm" 
                      className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Unban
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleBanUser(user)} 
                      variant="outline" 
                      size="sm" 
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Ban className="h-3 w-3 mr-1" />
                      Ban
                    </Button>
                  )}
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedUser?.isBanned ? "Unban User" : "Ban User"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedUser?.isBanned
                ? `Are you sure you want to unban ${selectedUser?.username}?`
                : `Are you sure you want to ban ${selectedUser?.username}? This will prevent them from accessing most platform features.`}
            </DialogDescription>
          </DialogHeader>
          
          {!selectedUser?.isBanned && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="banReason" className="text-sm font-medium text-gray-300">
                  Ban Reason <span className="text-gray-500">(optional)</span>
                </label>
                <Textarea
                  id="banReason"
                  placeholder="Why are you banning this user?"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitBan}
              disabled={banUserMutation.isPending}
              className={selectedUser?.isBanned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
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
    </>
  );
}