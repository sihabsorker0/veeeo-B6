import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Users, Video, MessageSquare, Eye, Settings, Upload, 
  ChevronRight, Activity
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

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
  // Stats query
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="flex">
          <AdminSidebar />
          <div className="flex-1">
            <AdminHeader
              title="Admin Dashboard"
              subtitle="Overview of platform statistics and management tools"
            />
            <div className="p-8">
              <div className="animate-pulse">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        <AdminSidebar />
        
        <div className="flex-1">
          <AdminHeader
            title="Admin Dashboard"
            subtitle="Overview of platform statistics and management tools"
            actions={
              <>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </>
            }
          />

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

            <div className="bg-gray-800 rounded-lg mb-8">
              <div className="flex">
                <button className="flex-1 text-center py-3 border-b-2 border-red-600 text-white">
                  <span className="flex items-center justify-center">
                    <Video className="h-4 w-4 mr-2" />
                    Recent Uploads
                  </span>
                </button>
                <button className="flex-1 text-center py-3 border-b-2 border-gray-800 text-gray-400 hover:text-white">
                  <span className="flex items-center justify-center">
                    <Users className="h-4 w-4 mr-2" />
                    Recent Users
                  </span>
                </button>
                <button className="flex-1 text-center py-3 border-b-2 border-gray-800 text-gray-400 hover:text-white">
                  <span className="flex items-center justify-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Platform Activity
                  </span>
                </button>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1">Recent Video Uploads</h3>
                <p className="text-gray-400 mb-6">A list of recent videos uploaded to the platform.</p>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-medium text-gray-400 border-b border-gray-700">
                        <th className="pb-3 pl-3">TITLE</th>
                        <th className="pb-3">AUTHOR</th>
                        <th className="pb-3">VIEWS</th>
                        <th className="pb-3">DATE</th>
                        <th className="pb-3">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recentVideos && stats.recentVideos.length > 0 ? (
                        stats.recentVideos.map((video) => (
                          <tr key={video._id} className="border-b border-gray-700 last:border-0">
                            <td className="py-4 pl-3">
                              <div className="text-white font-medium">{video.title}</div>
                            </td>
                            <td className="py-4">
                              <div className="text-gray-400">Author</div>
                            </td>
                            <td className="py-4">
                              <div className="text-gray-400">{video.views}</div>
                            </td>
                            <td className="py-4">
                              <div className="text-gray-400">{new Date(video.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="py-4">
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                View
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400">
                            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No recent video uploads</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-6">
                  <Link href="/super-control-panel-9xvA3t/videos">
                    <Button variant="ghost" className="text-gray-400 hover:text-white">
                      View All Videos
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}