import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity, TrendingUp, UserPlus, Video, Eye, ThumbsUp, 
  Calendar, BarChart3, LineChart, PieChart
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

interface DashboardStats {
  totalUsers: number;
  totalVideos: number;
  totalComments: number;
  totalViews: number;
  totalLikes: number;
}

export default function AdminAnalytics() {
  // Stats query
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="flex">
          <AdminSidebar />
          <div className="flex-1">
            <AdminHeader
              title="Analytics"
              subtitle="Platform performance metrics and insights"
            />
            <div className="p-8">
              <div className="animate-pulse">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-64 bg-gray-800 rounded-lg"></div>
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

  // This would be real data in a production environment
  const weeklyUserData = [10, 15, 8, 12, 20, 18, 25];
  const weeklyViewData = [120, 145, 180, 210, 250, 190, 230];
  const weeklyLikeData = [45, 60, 35, 50, 75, 65, 90];
  const contentDistribution = [
    { category: "Music", value: 35 },
    { category: "Gaming", value: 20 },
    { category: "Tutorials", value: 15 },
    { category: "Vlogs", value: 12 },
    { category: "Other", value: 18 }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader
            title="Analytics"
            subtitle="Platform performance metrics and insights"
          />

          <div className="p-8">
            <h2 className="text-xl font-bold mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Users</p>
                      <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
                      <p className="text-xs text-green-500 mt-1">+12% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Videos</p>
                      <p className="text-3xl font-bold text-white">{stats?.totalVideos || 0}</p>
                      <p className="text-xs text-green-500 mt-1">+8% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                      <Video className="h-6 w-6 text-purple-400" />
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
                      <p className="text-xs text-green-500 mt-1">+25% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                      <Eye className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Likes</p>
                      <p className="text-3xl font-bold text-white">{stats?.totalLikes || 0}</p>
                      <p className="text-xs text-green-500 mt-1">+18% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                      <ThumbsUp className="h-6 w-6 text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <LineChart className="mr-2 h-5 w-5" />
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between px-2">
                    {weeklyUserData.map((value, index) => (
                      <div key={index} className="relative flex flex-col items-center">
                        <div 
                          className="bg-blue-600 rounded-t w-12" 
                          style={{ height: `${value * 8}px` }}
                        ></div>
                        <span className="text-xs text-gray-400 mt-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    View Count
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between px-2">
                    {weeklyViewData.map((value, index) => (
                      <div key={index} className="relative flex flex-col items-center">
                        <div 
                          className="bg-green-600 rounded-t w-12" 
                          style={{ height: `${value / 1.5}px` }}
                        ></div>
                        <span className="text-xs text-gray-400 mt-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Like Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between px-2">
                    {weeklyLikeData.map((value, index) => (
                      <div key={index} className="relative flex flex-col items-center">
                        <div 
                          className="bg-red-600 rounded-t w-12" 
                          style={{ height: `${value * 2.5}px` }}
                        ></div>
                        <span className="text-xs text-gray-400 mt-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <PieChart className="mr-2 h-5 w-5" />
                    Content Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full border-8 border-gray-700 relative">
                      {contentDistribution.map((item, index) => {
                        const startAngle = index === 0 ? 0 : 
                          contentDistribution.slice(0, index).reduce((acc, curr) => acc + curr.value, 0) / 100 * 360;
                        const endAngle = startAngle + (item.value / 100 * 360);
                        const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
                        
                        const startX = 24 + 24 * Math.cos((startAngle - 90) * Math.PI / 180);
                        const startY = 24 + 24 * Math.sin((startAngle - 90) * Math.PI / 180);
                        const endX = 24 + 24 * Math.cos((endAngle - 90) * Math.PI / 180);
                        const endY = 24 + 24 * Math.sin((endAngle - 90) * Math.PI / 180);
                        
                        const colors = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"];
                        
                        return (
                          <div 
                            key={index} 
                            className="absolute inset-0"
                            style={{
                              clipPath: `path('M 24 24 L ${startX} ${startY} A 24 24 0 ${largeArcFlag} 1 ${endX} ${endY} Z')`,
                              backgroundColor: colors[index % colors.length]
                            }}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-6">
                    {contentDistribution.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ 
                            backgroundColor: ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"][index % 5] 
                          }}
                        ></div>
                        <span className="text-xs text-gray-300">{item.category} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}