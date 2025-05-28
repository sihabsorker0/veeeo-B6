import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Activity,
  BarChart3,
  Eye,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Gauge,
  Video,
  ArrowRight,
  Wallet
} from "lucide-react";

interface VideoAnalytic {
  _id: string;
  title: string;
  thumbnailUrl?: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  createdAt: string;
  estimatedRevenue: number;
  engagement: string;
}

interface AnalyticsSummary {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalRevenue: number;
  totalAvailableRevenue: number;
  averageViewsPerVideo: number;
  mostViewedVideo: VideoAnalytic | null;
  topPerformingVideo: VideoAnalytic | null;
}

interface AnalyticsData {
  videos: VideoAnalytic[];
  summary: AnalyticsSummary;
}

// Format number with locale
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function VideoAnalytics() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [timeFilter, setTimeFilter] = useState("all");
  const { toast } = useToast();

  // Check monetization approval status first
  const { data: monetizationStatus } = useQuery({
    queryKey: ["/api/monetization/status"],
  });

  // Fetch analytics data only if approved
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/creator/video-analytics"],
    enabled: monetizationStatus?.hasAccess,
    refetchOnWindowFocus: false,
  });

  // Revenue transfer mutation
  const transferRevenueMutation = useMutation({
    mutationFn: () => apiRequest("/api/monetization/transfer-revenue", {
      method: "POST",
    }),
    onSuccess: (result: any) => {
      toast({
        title: "Revenue Transferred!",
        description: result.message || "Revenue successfully transferred to your monetization balance",
      });
      // Refresh analytics data
      queryClient.invalidateQueries({ queryKey: ["/api/creator/video-analytics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.response?.data?.message || "Failed to transfer revenue",
        variant: "destructive",
      });
    },
  });

  // Filter videos based on time range
  const getFilteredVideos = () => {
    if (!data?.videos) return [];

    if (timeFilter === "all") return data.videos;

    const now = new Date();
    let cutoffDate = new Date();

    switch (timeFilter) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data.videos;
    }

    return data.videos.filter(video => new Date(video.createdAt) >= cutoffDate);
  };

  const filteredVideos = getFilteredVideos();

  // Prepare chart data for engagement distribution
  const getEngagementDistribution = () => {
    if (!filteredVideos.length) return [];

    const ranges = [
      { name: '0-1%', range: [0, 1], count: 0 },
      { name: '1-2%', range: [1, 2], count: 0 },
      { name: '2-5%', range: [2, 5], count: 0 },
      { name: '5-10%', range: [5, 10], count: 0 },
      { name: '10%+', range: [10, 100], count: 0 }
    ];

    filteredVideos.forEach(video => {
      const engagement = parseFloat(video.engagement);
      for (const range of ranges) {
        if (engagement >= range.range[0] && engagement < range.range[1]) {
          range.count++;
          break;
        } else if (range.name === '10%+' && engagement >= 10) {
          range.count++;
          break;
        }
      }
    });

    return ranges;
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Handle monetization approval status
  if (monetizationStatus && !monetizationStatus.hasAccess) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Video Analytics</h1>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
          <BarChart3 className="h-16 w-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-400 mb-2">
            Monetization Access Required
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-6">
            You need monetization approval to access video analytics. Please go to the Monetization page to request access.
          </p>
          <Button 
            onClick={() => window.location.href = '/user-monetization'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Monetization
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Video Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-8 w-1/2 mb-1" />
                <Skeleton className="h-3 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full mb-8" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
            Error Loading Analytics
          </h3>
          <p className="text-red-700 dark:text-red-300">
            Failed to load your video analytics. Please try again later.
          </p>
          <Button variant="destructive" className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data || !data.videos || data.videos.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Video Analytics</h1>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
          <Video className="h-16 w-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-400 mb-2">
            No Videos Found
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-6">
            You haven't uploaded any videos yet. Upload your first video to start tracking analytics.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
            Upload Your First Video
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Video Analytics</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button
            variant={timeFilter === "all" ? "default" : "outline"}
            onClick={() => setTimeFilter("all")}
            className="text-xs md:text-sm"
          >
            All Time
          </Button>
          <Button
            variant={timeFilter === "week" ? "default" : "outline"}
            onClick={() => setTimeFilter("week")}
            className="text-xs md:text-sm"
          >
            Last Week
          </Button>
          <Button
            variant={timeFilter === "month" ? "default" : "outline"}
            onClick={() => setTimeFilter("month")}
            className="text-xs md:text-sm"
          >
            Last Month
          </Button>
          <Button
            variant={timeFilter === "year" ? "default" : "outline"}
            onClick={() => setTimeFilter("year")}
            className="text-xs md:text-sm"
          >
            Last Year
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Views</p>
                <p className="text-3xl font-bold">{formatNumber(data.summary.totalViews)}</p>
                <p className="text-xs text-green-500 mt-1">
                  ~{formatNumber(data.summary.averageViewsPerVideo)} per video
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Engagement</p>
                <p className="text-3xl font-bold">{formatNumber(data.summary.totalLikes + data.summary.totalComments)}</p>
                <p className="text-xs text-green-500 mt-1">
                  {formatNumber(data.summary.totalLikes)} likes, {formatNumber(data.summary.totalComments)} comments
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Videos</p>
                <p className="text-3xl font-bold">{data.summary.totalVideos}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {filteredVideos.length} in selected period
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(data.summary.totalRevenue)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Available: {formatCurrency(data.summary.totalAvailableRevenue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            {(data.summary.totalAvailableRevenue || 0) > 0 && (
              <Button
                onClick={() => transferRevenueMutation.mutate()}
                disabled={transferRevenueMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {transferRevenueMutation.isPending ? (
                  "Transferring..."
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Transfer {formatCurrency(data.summary.totalAvailableRevenue || 0)}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        defaultValue="overview"
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="mb-8"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">Video List</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.summary.mostViewedVideo && (
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Most Viewed Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                      {data.summary.mostViewedVideo.thumbnailUrl ? (
                        <img 
                          src={data.summary.mostViewedVideo.thumbnailUrl} 
                          alt={data.summary.mostViewedVideo.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                          <Video className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium line-clamp-1">{data.summary.mostViewedVideo.title}</h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatNumber(data.summary.mostViewedVideo.views)} views
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {formatNumber(data.summary.mostViewedVideo.likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {formatNumber(data.summary.mostViewedVideo.comments)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(data.summary.mostViewedVideo.estimatedRevenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.summary.topPerformingVideo && (
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-purple-500" />
                    Highest Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                      {data.summary.topPerformingVideo.thumbnailUrl ? (
                        <img 
                          src={data.summary.topPerformingVideo.thumbnailUrl} 
                          alt={data.summary.topPerformingVideo.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                          <Video className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium line-clamp-1">{data.summary.topPerformingVideo.title}</h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {data.summary.topPerformingVideo.engagement}% engagement rate
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {formatNumber(data.summary.topPerformingVideo.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {formatNumber(data.summary.topPerformingVideo.likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {formatNumber(data.summary.topPerformingVideo.comments)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* View Distribution Chart */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Views Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredVideos.slice(0, 10)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="title" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tickFormatter={(value) => value && typeof value === 'string' && value.length > 20 ? `${value.substring(0, 20)}...` : value}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${formatNumber(value)} views`, 'Views']}
                      labelFormatter={(label) => `Title: ${label}`}
                    />
                    <Bar 
                      dataKey="views" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Distribution */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                Engagement Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-center">
              <div className="h-64 w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getEngagementDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {getEngagementDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} videos`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6">
                <h4 className="font-medium mb-2">What This Means:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Engagement rate shows the percentage of viewers who interacted with your video (likes vs. views).
                  Higher engagement typically leads to better recommendations and revenue.
                </p>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Tips to Improve:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
                    <li>Ask viewers to like and comment in your videos</li>
                    <li>Create content that sparks discussion</li>
                    <li>Respond to comments to encourage engagement</li>
                    <li>Use attention-grabbing thumbnails and titles</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-500" />
                Your Videos Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Video</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Likes</TableHead>
                      <TableHead className="text-right">Comments</TableHead>
                      <TableHead className="text-right">Engagement</TableHead>
                      <TableHead className="text-right">Est. Revenue</TableHead>
                      <TableHead>Upload Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVideos.map((video) => (
                      <TableRow key={video._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                              {video.thumbnailUrl ? (
                                <img 
                                  src={video.thumbnailUrl} 
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                                  <Video className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </div>
                              )}
                            </div>
                            <span className="line-clamp-1">{video.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(video.views)}</TableCell>
                        <TableCell className="text-right">{formatNumber(video.likes)}</TableCell>
                        <TableCell className="text-right">{formatNumber(video.comments)}</TableCell>
                        <TableCell className="text-right">{video.engagement}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(video.estimatedRevenue)}</TableCell>
                        <TableCell>{formatDate(video.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                Engagement Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredVideos.slice(0, 10)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="title" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tickFormatter={(value) => value && typeof value === 'string' && value.length > 20 ? `${value.substring(0, 20)}...` : value}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      name="Likes" 
                      dataKey="likes" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      name="Comments" 
                      dataKey="comments" 
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Top Videos by Engagement Rate</h3>
                  <div className="space-y-3">
                    {[...filteredVideos]
                      .sort((a, b) => parseFloat(b.engagement) - parseFloat(a.engagement))
                      .slice(0, 5)
                      .map((video, index) => (
                        <div key={video._id} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300">
                            {index + 1}
                          </div>
                          <div className="flex-1 truncate">{video.title}</div>
                          <div className="font-medium">{video.engagement}%</div>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Engagement Insights</h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Your videos with highest engagement rates tend to be focused on specific topics that resonate with your audience.
                    </p>
                    <h4 className="font-medium mb-2">Tips for Improving Engagement:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
                      <li>Post consistently to keep your audience engaged</li>
                      <li>Ask questions in your videos to encourage comments</li>
                      <li>Respond to comments to build community</li>
                      <li>Create content that addresses current trends</li>
                      <li>Use clear calls-to-action for likes and comments</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Revenue Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredVideos.slice(0, 10)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="title" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tickFormatter={(value) => value && typeof value === 'string' && value.length > 20 ? `${value.substring(0, 20)}...` : value}
                    />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Est. Revenue']} />
                    <Bar 
                      dataKey="estimatedRevenue" 
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Top Earning Videos</h3>
                  <div className="space-y-3">
                    {[...filteredVideos]
                      .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
                      .slice(0, 5)
                      .map((video, index) => (
                        <div key={video._id} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-medium text-green-700 dark:text-green-300">
                            {index + 1}
                          </div>
                          <div className="flex-1 truncate">{video.title}</div>
                          <div className="font-medium">{formatCurrency(video.estimatedRevenue)}</div>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Revenue Insights</h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Your revenue is directly related to the number of views your videos receive and the engagement they generate.
                    </p>
                    <h4 className="font-medium mb-2">Tips for Increasing Revenue:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
                      <li>Focus on topics that historically perform well</li>
                      <li>Optimize video length for maximum ad placements</li>
                      <li>Create content that appeals to premium advertisers</li>
                      <li>Promote your videos on other platforms to drive traffic</li>
                      <li>Collaborate with other creators to reach new audiences</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}