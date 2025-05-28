import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  Users, Video, MessageSquare, Eye, ThumbsUp, ArrowUp,
  Upload, BarChart3, TrendingUp, Clock, Calendar,
  Bell, Settings, Filter, DownloadCloud, Zap, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import ImprovedAdminSidebar from "@/components/ImprovedAdminSidebar";
import ImprovedAdminHeader from "@/components/ImprovedAdminHeader";
// Import admin styles
import "@/styles/admin.css";

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

export default function ImprovedAdminDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Stats query
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Effect to handle body overflow when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (isLoading) {
    return (
      <div className="admin-layout">
        <ImprovedAdminSidebar />
        <div className="admin-content">
          <ImprovedAdminHeader 
            title="Dashboard" 
            subtitle="Loading statistics..."
            onMobileMenuClick={toggleMobileMenu}
          />
          <div className="main-container">
            <div className="animate-pulse">
              <div className="stats-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-[var(--admin-card-bg)] rounded-lg"></div>
                ))}
              </div>
              <div className="h-96 bg-[var(--admin-card-bg)] rounded-lg mb-6"></div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={toggleMobileMenu}>
            <div className="absolute inset-0 bg-black opacity-50 backdrop-blur-sm"></div>
            <ImprovedAdminSidebar isMobile onMobileClose={toggleMobileMenu} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <ImprovedAdminSidebar />
      <div className="admin-content">
        <ImprovedAdminHeader 
          title="Admin Dashboard" 
          subtitle="Platform statistics and management overview"
          onMobileMenuClick={toggleMobileMenu}
          actions={
            <Button className="admin-button button-primary">
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          }
        />

        <div className="main-container">
          {/* Stats Cards */}
          <div className="stats-grid slide-in-up">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(3, 169, 244, 0.1)' }}>
                <Video className="h-6 w-6 text-[#03A9F4]" />
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Videos</div>
                <div className="stat-value">{stats?.totalVideos?.toLocaleString() || 0}</div>
                <div className="stat-trend trend-up">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <span>7% from last month</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(0, 200, 83, 0.1)' }}>
                <Users className="h-6 w-6 text-[#00C853]" />
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Users</div>
                <div className="stat-value">{stats?.totalUsers?.toLocaleString() || 0}</div>
                <div className="stat-trend trend-up">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <span>12% from last month</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)' }}>
                <Eye className="h-6 w-6 text-[#FF0000]" />
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Views</div>
                <div className="stat-value">{stats?.totalViews?.toLocaleString() || 0}</div>
                <div className="stat-trend trend-up">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <span>18% from last month</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)' }}>
                <MessageSquare className="h-6 w-6 text-[#FFC107]" />
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Comments</div>
                <div className="stat-value">{stats?.totalComments?.toLocaleString() || 0}</div>
                <div className="stat-trend trend-up">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <span>5% from last month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Tabs */}
          <div className="admin-card mb-6">
            <div className="card-header">
              <div className="card-title">
                <BarChart3 className="card-title-icon h-5 w-5" />
                Platform Activity
              </div>
              <div className="card-actions">
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
            <Tabs defaultValue="recent-uploads" className="w-full">
              <div className="border-b border-[var(--admin-border)]">
                <TabsList className="admin-tabs">
                  <TabsTrigger value="recent-uploads" className="admin-tab">Recent Uploads</TabsTrigger>
                  <TabsTrigger value="recent-users" className="admin-tab">Recent Users</TabsTrigger>
                  <TabsTrigger value="platform-trends" className="admin-tab">Platform Trends</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="recent-uploads" className="card-body pt-4">
                {stats?.recentVideos && stats.recentVideos.length > 0 ? (
                  <div className="overflow-hidden">
                    <table className="data-table w-full">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Views</th>
                          <th>Likes</th>
                          <th>Date</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentVideos.slice(0, 5).map((video) => (
                          <tr key={video._id}>
                            <td>
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded bg-[var(--admin-active-bg)] flex items-center justify-center mr-3">
                                  <Video className="h-5 w-5 text-[var(--admin-text-secondary)]" />
                                </div>
                                <span className="font-medium">{video.title}</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center">
                                <Eye className="h-4 w-4 mr-1 text-[var(--admin-text-secondary)]" />
                                {video.views.toLocaleString()}
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center">
                                <ThumbsUp className="h-4 w-4 mr-1 text-[var(--admin-text-secondary)]" />
                                {video.likes.toLocaleString()}
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-[var(--admin-text-secondary)]" />
                                {new Date(video.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="text-right">
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--admin-text-secondary)]">
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--admin-accent)]">
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end mt-4">
                      <Button className="admin-button button-outline" asChild>
                        <a href="/admin/videos">View All Videos</a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--admin-border)] rounded-lg">
                    <Video className="h-12 w-12 text-[var(--admin-text-muted)] mb-3" />
                    <p className="text-[var(--admin-text-secondary)] mb-4">No recent video uploads found</p>
                    <Button className="admin-button button-primary">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Video
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recent-users" className="card-body pt-4">
                {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                  <div className="overflow-hidden">
                    <table className="data-table w-full">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Joined</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentUsers.slice(0, 5).map((user) => (
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
                            <td>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-[var(--admin-text-secondary)]" />
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="text-right">
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--admin-text-secondary)]">
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--admin-accent)]">
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end mt-4">
                      <Button className="admin-button button-outline" asChild>
                        <a href="/admin/users">View All Users</a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--admin-border)] rounded-lg">
                    <Users className="h-12 w-12 text-[var(--admin-text-muted)] mb-3" />
                    <p className="text-[var(--admin-text-secondary)]">No users found in the system</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="platform-trends" className="card-body pt-4">
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-[var(--admin-text-muted)] mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Platform Analytics</h3>
                  <p className="text-[var(--admin-text-secondary)] mb-4 max-w-lg">
                    Detailed platform trends and statistics are available in the Analytics dashboard.
                  </p>
                  <Button className="admin-button button-primary" asChild>
                    <a href="/admin/analytics">View Analytics</a>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Quick Actions */}
          <div className="admin-card">
            <div className="card-header">
              <div className="card-title">
                <Zap className="card-title-icon h-5 w-5" />
                Quick Actions
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <a href="/super-control-panel-9xvA3t/users" className="block p-4 bg-[var(--admin-hover-bg)] rounded-lg hover:bg-[var(--admin-active-bg)] transition-all transform hover:-translate-y-1">
                  <Users className="h-8 w-8 text-[#4CAF50] mb-3" />
                  <h3 className="text-base font-semibold text-[var(--admin-text-primary)] mb-1">User Management</h3>
                  <p className="text-sm text-[var(--admin-text-secondary)]">Manage users and permissions</p>
                </a>

                <a href="/super-control-panel-9xvA3t/videos" className="block p-4 bg-[var(--admin-hover-bg)] rounded-lg hover:bg-[var(--admin-active-bg)] transition-all transform hover:-translate-y-1">
                  <Video className="h-8 w-8 text-[#2196F3] mb-3" />
                  <h3 className="text-base font-semibold text-[var(--admin-text-primary)] mb-1">Video Management</h3>
                  <p className="text-sm text-[var(--admin-text-secondary)]">Manage video content and uploads</p>
                </a>

                <a href="/super-control-panel-9xvA3t/comments" className="block p-4 bg-[var(--admin-hover-bg)] rounded-lg hover:bg-[var(--admin-active-bg)] transition-all transform hover:-translate-y-1">
                  <MessageSquare className="h-8 w-8 text-[#9C27B0] mb-3" />
                  <h3 className="text-base font-semibold text-[var(--admin-text-primary)] mb-1">Comments</h3>
                  <p className="text-sm text-[var(--admin-text-secondary)]">Monitor and manage comments</p>
                </a>

                <a href="/super-control-panel-9xvA3t/analytics" className="block p-4 bg-[var(--admin-hover-bg)] rounded-lg hover:bg-[var(--admin-active-bg)] transition-all transform hover:-translate-y-1">
                  <TrendingUp className="h-8 w-8 text-[#FF5722] mb-3" />
                  <h3 className="text-base font-semibold text-[var(--admin-text-primary)] mb-1">Analytics</h3>
                  <p className="text-sm text-[var(--admin-text-secondary)]">View platform analytics and insights</p>
                </a>

                <a href="/manage-control-panel-Xx41q7" className="block p-4 bg-[var(--admin-hover-bg)] rounded-lg hover:bg-[var(--admin-active-bg)] transition-all transform hover:-translate-y-1">
                  <TrendingUp className="h-8 w-8 text-[#00BCD4] mb-3" />
                  <h3 className="text-base font-semibold text-[var(--admin-text-primary)] mb-1">Monetization</h3>
                  <p className="text-sm text-[var(--admin-text-secondary)]">Manage monetization and revenue</p>
                </a>

                <a href="/root-control-panel-9xvA3t" className="block p-4 bg-[var(--admin-hover-bg)] rounded-lg hover:bg-[var(--admin-active-bg)] transition-all transform hover:-translate-y-1">
                  <Zap className="h-8 w-8 text-[#FFC107] mb-3" />
                  <h3 className="text-base font-semibold text-[var(--admin-text-primary)] mb-1">Ad Network</h3>
                  <p className="text-sm text-[var(--admin-text-secondary)]">Manage advertisement campaigns</p>
                </a>

                <a href="/super-control-panel-9xvA3t/notifications" className="block p-4 bg-[var(--admin-hover-bg)] rounded-lg hover:bg-[var(--admin-active-bg)] transition-all transform hover:-translate-y-1">
                  <Bell className="h-8 w-8 text-[#8BC34A] mb-3" />
                  <h3 className="text-base font-semibold text-[var(--admin-text-primary)] mb-1">Notifications</h3>
                  <p className="text-sm text-[var(--admin-text-secondary)]">Manage system notifications</p>
                </a>

                <a href="/super-control-panel-9xvA3t/security" className="block p-4 bg-[var(--admin-hover-bg)] rounded-lg hover:bg-[var(--admin-active-bg)] transition-all transform hover:-translate-y-1">
                  <Shield className="h-8 w-8 text-[#FF9800] mb-3" />
                  <h3 className="text-base font-semibold text-[var(--admin-text-primary)] mb-1">Security</h3>
                  <p className="text-sm text-[var(--admin-text-secondary)]">Manage platform security settings</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={toggleMobileMenu}>
          <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"></div>
          <ImprovedAdminSidebar isMobile onMobileClose={toggleMobileMenu} />
        </div>
      )}
    </div>
  );
}