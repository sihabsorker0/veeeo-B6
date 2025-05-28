import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Video, MessageSquare, Eye, ThumbsUp, Calendar, Upload, Settings,
  TrendingUp, Activity, BarChart3, PlayCircle, UserCheck, Clock, Ban, Edit, 
  Trash2, UserX, CheckCircle, X, AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
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

interface DashboardStats {
  totalUsers: number;
  totalVideos: number;
  totalComments: number;
  totalViews: number;
  totalLikes: number;
  recentUsers: Array<{
    _id: string;
    username: string;
    email: string;
    createdAt: string;
  }>;
  recentVideos: Array<{
    _id: string;
    title: string;
    views: number;
    likes: number;
    createdAt: string;
  }>;
}

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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for user banning
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  
  // State for video editing/deleting
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [deleteVideoDialogOpen, setDeleteVideoDialogOpen] = useState(false);
  
  // Queries
  const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });
  
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: activeTab === "users",
  });
  
  const { data: videos, isLoading: isVideosLoading } = useQuery<Video[]>({
    queryKey: ["/api/admin/videos"],
    enabled: activeTab === "videos",
  });
  
  // Mutations
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
  
  const isLoading = isStatsLoading || 
    (activeTab === "users" && isUsersLoading) || 
    (activeTab === "videos" && isVideosLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="flex">
          <div className="w-64 bg-gray-900 border-r border-gray-800 h-screen">
            <div className="animate-pulse p-6 space-y-4">
              <div className="h-8 bg-gray-800 rounded"></div>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-800 rounded w-64 mb-8"></div>
              <div className="grid grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        <div className="w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <PlayCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">VidVault Admin</h1>
                <p className="text-xs text-gray-400">Dashboard</p>
              </div>
            </div>

            <nav className="space-y-2">
              <div className="bg-gray-800 rounded-lg p-3 border-l-4 border-red-600">
                <div className="flex items-center gap-3 text-white">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Dashboard</span>
                </div>
              </div>
              
              <Link href="/adnetwork">
                <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Ad Network</span>
                  </div>
                </div>
              </Link>

              <Link href="/monetization">
                <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Monetization</span>
                  </div>
                </div>
              </Link>
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">A</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">admin</p>
                    <p className="text-xs text-gray-400">Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="border-b border-gray-800 bg-gray-900 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400 mt-1">Overview of platform statistics and management tools</p>
              </div>
              <div className="flex gap-3">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Videos</p>
                      <p className="text-3xl font-bold text-white">{stats?.totalVideos || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">+0% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <Video className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Users</p>
                      <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">+0% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Views</p>
                      <p className="text-3xl font-bold text-white">{stats?.totalViews || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">+0% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                      <Eye className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Comments</p>
                      <p className="text-3xl font-bold text-white">{stats?.totalComments || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">+0% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
                  User Management
                </TabsTrigger>
                <TabsTrigger value="videos" className="data-[state=active]:bg-gray-700">
                  Video Management
                </TabsTrigger>
                <TabsTrigger value="platform-activity" className="data-[state=active]:bg-gray-700">
                  Platform Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Video Uploads</CardTitle>
                    <p className="text-gray-400">A list of recent videos uploaded to the platform.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-400 pb-2 border-b border-gray-700">
                        <span>TITLE</span>
                        <span>AUTHOR</span>
                        <span>VIEWS</span>
                        <span>DATE</span>
                        <span>ACTIONS</span>
                      </div>
                      {stats?.recentVideos?.map((video) => (
                        <div key={video._id} className="grid grid-cols-5 gap-4 py-3 border-b border-gray-800 last:border-0">
                          <div className="text-white font-medium truncate">{video.title}</div>
                          <div className="text-gray-400">Unknown</div>
                          <div className="text-gray-400">{video.views}</div>
                          <div className="text-gray-400">{new Date(video.createdAt).toLocaleDateString()}</div>
                          <div>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                              View
                            </Button>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-gray-400">
                          <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No recent video uploads</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Users</CardTitle>
                    <p className="text-gray-400">Recently registered users on the platform.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.recentUsers?.map((user) => (
                        <div key={user._id} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-300">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{user.username}</p>
                              <p className="text-sm text-gray-400">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(user.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-gray-400">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No recent users</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users">
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
              </TabsContent>

              <TabsContent value="videos">
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
              </TabsContent>

              <TabsContent value="platform-activity">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Platform Activity</CardTitle>
                    <p className="text-gray-400">Recent platform activities and metrics.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-16 text-gray-400">
                      <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Platform Analytics</h3>
                      <p>Detailed analytics coming soon.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

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
    </div>
  );
}