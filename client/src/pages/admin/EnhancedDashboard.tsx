import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Users, Video, MessageSquare, Eye, ThumbsUp, Settings,
  Upload, BarChart3, PlayCircle, TrendingUp, Activity
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import UserManagement from "./UserManagement";
import VideoManagement from "./VideoManagement";

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

export default function EnhancedDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Stats query
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

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
                <p className="text-gray-400 mt-1">Enhanced management tools for complete platform control</p>
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
                <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Recent Video Uploads</CardTitle>
                      <p className="text-gray-400">A list of recent videos uploaded to the platform.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats?.recentVideos?.length > 0 ? (
                          stats.recentVideos.map((video) => (
                            <div key={video._id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                                  <Video className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-white">{video.title}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-gray-400 flex items-center">
                                      <Eye className="h-3 w-3 mr-1" /> {video.views}
                                    </p>
                                    <p className="text-xs text-gray-400 flex items-center">
                                      <ThumbsUp className="h-3 w-3 mr-1" /> {video.likes}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">
                                  {new Date(video.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No recent video uploads</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Recent Users</CardTitle>
                      <p className="text-gray-400">Recently registered users on the platform.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats?.recentUsers?.length > 0 ? (
                          stats.recentUsers.map((user) => (
                            <div key={user._id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-300">
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-white">{user.username}</p>
                                  <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No recent users</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="users">
                <UserManagement />
              </TabsContent>

              <TabsContent value="videos">
                <VideoManagement />
              </TabsContent>

              <TabsContent value="analytics">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Platform Analytics</CardTitle>
                    <p className="text-gray-400">Detailed platform analytics and metrics.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-16 text-gray-400">
                      <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
                      <p>Detailed analytics coming soon.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}