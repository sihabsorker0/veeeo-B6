import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Video,
  MessageSquare,
  Eye,
  ThumbsUp,
  Calendar,
  Upload,
  Settings,
  TrendingUp,
  Activity,
  BarChart3,
  PlayCircle,
  UserCheck,
  Clock,
} from "lucide-react";
import { Link } from "wouter";

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

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="flex">
          {/* Sidebar Skeleton */}
          <div className="w-64 bg-gray-900 border-r border-gray-800 h-screen">
            <div className="animate-pulse p-6 space-y-4">
              <div className="h-8 bg-gray-800 rounded"></div>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
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
        {/* Admin Sidebar */}
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

              <Link href="/admin/adnetwork">
                <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Ad Network</span>
                  </div>
                </div>
              </Link>

              <Link href="/admin/withdraw">
                <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Withdrawals</span>
                  </div>
                </div>
              </Link>

              <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                  <Video className="h-4 w-4" />
                  <span className="text-sm">Videos</span>
                </div>
              </div>

              <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-sm">Users</span>
                </div>
              </div>

              <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Comments</span>
                </div>
              </div>

              <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Analytics</span>
                </div>
              </div>

              <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm">Settings</span>
                </div>
              </div>
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

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="border-b border-gray-800 bg-gray-900 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Admin Dashboard
                </h1>
                <p className="text-gray-400 mt-1">
                  Overview of platform statistics and management tools
                </p>
              </div>
              <div className="flex gap-3">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Videos</p>
                      <p className="text-3xl font-bold text-white">
                        {stats?.totalVideos || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        +0% from last month
                      </p>
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
                      <p className="text-3xl font-bold text-white">
                        {stats?.totalUsers || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        +0% from last month
                      </p>
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
                      <p className="text-3xl font-bold text-white">
                        {stats?.totalViews || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        +0% from last month
                      </p>
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
                      <p className="text-sm text-gray-400 mb-1">
                        Total Comments
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {stats?.totalComments || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        +0% from last month
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="recent-uploads" className="space-y-6">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger
                  value="recent-uploads"
                  className="data-[state=active]:bg-gray-700"
                >
                  Recent Uploads
                </TabsTrigger>
                <TabsTrigger
                  value="recent-users"
                  className="data-[state=active]:bg-gray-700"
                >
                  Recent Users
                </TabsTrigger>
                <TabsTrigger
                  value="platform-activity"
                  className="data-[state=active]:bg-gray-700"
                >
                  Platform Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recent-uploads">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Recent Video Uploads
                    </CardTitle>
                    <p className="text-gray-400">
                      A list of recent videos uploaded to the platform.
                    </p>
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
                        <div
                          key={video._id}
                          className="grid grid-cols-5 gap-4 py-3 border-b border-gray-800 last:border-0"
                        >
                          <div className="text-white font-medium truncate">
                            {video.title}
                          </div>
                          <div className="text-gray-400">Unknown</div>
                          <div className="text-gray-400">{video.views}</div>
                          <div className="text-gray-400">
                            {new Date(video.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white"
                            >
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
                    {stats?.recentVideos?.length > 0 && (
                      <div className="mt-6 flex justify-center">
                        <Button
                          variant="outline"
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          View All Videos
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recent-users">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Users</CardTitle>
                    <p className="text-gray-400">
                      Recently registered users on the platform.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.recentUsers?.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-4 bg-gray-900 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-300">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {user.username}
                              </p>
                              <p className="text-sm text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="secondary"
                              className="bg-gray-700 text-gray-300"
                            >
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

              <TabsContent value="platform-activity">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Platform Activity
                    </CardTitle>
                    <p className="text-gray-400">
                      Recent platform activities and metrics.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-16 text-gray-400">
                      <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">
                        Activate Windows
                      </h3>
                      <p>Go to Settings to activate Windows.</p>
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
