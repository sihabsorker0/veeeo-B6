import { Switch, Route, useLocation } from "wouter";
import Header from "@/components/Header";
import Sidebar from "@/components/SidebarNew";
import MobileMenubar from "@/components/MobileMenubar";
import Home from "@/pages/Home";
import VideoPage from "@/pages/VideoPage";
import VideoEdit from "@/pages/VideoEdit";
import Channel from "@/pages/Channel";
import History from "@/pages/History";
import WatchLater from "@/pages/WatchLater";
import LikedVideos from "@/pages/LikedVideos";
import Subscriptions from "@/pages/Subscriptions";
import Library from "@/pages/Library";
import Playlists from "@/pages/Playlists";
import Trash from "@/pages/Trash";
import Settings from "@/pages/Settings";
import Help from "@/pages/Help";
import Feedback from "@/pages/Feedback";
import Monetization from "@/pages/Monetization";
import Search from "@/pages/Search";
import AdminDashboard from "@/pages/admin/ImprovedAdminDashboard";
import AdminUserManagement from "@/pages/admin/AdminUserManagement";
import AdminVideoManagement from "@/pages/admin/AdminVideoManagement";
import AdminComments from "@/pages/admin/AdminComments";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminHelp from "@/pages/admin/AdminHelp";
import AdNetworkDashboard from "@/pages/adnetwork/Dashboard";
import MonetizationDashboard from "@/pages/monetization/Dashboard";
import VideoAnalytics from "@/pages/creator/VideoAnalytics";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContextFixed";
import { ThemeProvider } from "@/components/ThemeProviderFixed";

// Admin Routes Component
function AdminRoutes() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-gray-950 text-white">
          <Switch>
            <Route path="/super-control-panel-9xvA3t" component={AdminDashboard} />
            <Route path="/super-control-panel-9xvA3t/users" component={AdminUserManagement} />
            <Route path="/super-control-panel-9xvA3t/videos" component={AdminVideoManagement} />
            <Route path="/super-control-panel-9xvA3t/comments" component={AdminComments} />
            <Route path="/super-control-panel-9xvA3t/analytics" component={AdminAnalytics} />
            <Route path="/super-control-panel-9xvA3t/notifications" component={AdminNotifications} />
            <Route path="/super-control-panel-9xvA3t/settings" component={AdminSettings} />
            <Route path="/super-control-panel-9xvA3t/help" component={AdminHelp} />
            <Route path="/manage-control-panel-Xx41q7" component={MonetizationDashboard} />
            <Route path="/root-control-panel-9xvA3t" component={AdNetworkDashboard} />
          </Switch>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

// Main App Component
export default function App() {
  const [location] = useLocation();

  // If it's an admin route, use AdminRoutes
  if (location.startsWith('/super-control-panel-9xvA3t') || location.startsWith('/manage-control-panel-Xx41q7') || location.startsWith('/root-control-panel-9xvA3t')) {
    return <AdminRoutes />;
  }

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="font-sans bg-lightBg dark:bg-darkBg text-gray-900 dark:text-gray-100 transition-colors duration-200 min-h-screen">
          <Header toggleSidebar={toggleSidebar} />
          <div className="flex pt-16 h-[calc(100vh-64px)]">
            <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-0 lg:ml-64' : 'ml-0'} overflow-auto pb-10 md:pb-10 pb-20`}>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/explore" component={Search} />
                <Route path="/search" component={Search} />
                <Route path="/video/:id" component={VideoPage} />
                <Route path="/video/:id/edit" component={VideoEdit} />
                <Route path="/channel/:id" component={Channel} />
                <Route path="/history" component={History} />
                <Route path="/watch-later" component={WatchLater} />
                <Route path="/liked-videos" component={LikedVideos} />
                <Route path="/subscriptions" component={Subscriptions} />
                <Route path="/library" component={Library} />
                <Route path="/playlists" component={Playlists} />
                <Route path="/trash" component={Trash} />
                <Route path="/settings" component={Settings} />
                <Route path="/help" component={Help} />
                <Route path="/feedback" component={Feedback} />
                <Route path="/monetization" component={Monetization} />
                <Route path="/creator/analytics" component={VideoAnalytics} />
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/adnetwork" component={AdNetworkDashboard} />
                <Route path="/admin/withdraw" component={MonetizationDashboard} />
                <Route path="/user-monetization" component={Monetization} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
          <MobileMenubar />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

// Export AdminRoutes for use in other files
export { AdminRoutes };