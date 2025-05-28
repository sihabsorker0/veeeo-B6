import { Link, useLocation } from "wouter";
import { 
  BarChart3, Video, Users, MessageSquare, Activity, 
  Bell, Settings, HelpCircle, ArrowLeft, PlayCircle
} from "lucide-react";

export default function AdminSidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="w-60 bg-gray-950 border-r border-gray-800 h-screen sticky top-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <PlayCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">VidVault Admin</h1>
          </div>
        </div>

        <nav className="space-y-1">
          <Link href="/super-control-panel-9xvA3t">
            <div className={`p-3 rounded-lg ${isActive("/super-control-panel-9xvA3t") ? "bg-gray-800 border-l-4 border-red-600 pl-2" : "hover:bg-gray-800 transition-colors cursor-pointer"}`}>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </div>
            </div>
          </Link>

          <Link href="/super-control-panel-9xvA3t/videos">
            <div className={`p-3 rounded-lg ${isActive("/super-control-panel-9xvA3t/videos") ? "bg-gray-800 border-l-4 border-red-600 pl-2" : "hover:bg-gray-800 transition-colors cursor-pointer"}`}>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                <Video className="h-4 w-4" />
                <span className="text-sm font-medium">Videos</span>
              </div>
            </div>
          </Link>

          <Link href="/super-control-panel-9xvA3t/users">
            <div className={`p-3 rounded-lg ${isActive("/super-control-panel-9xvA3t/users") ? "bg-gray-800 border-l-4 border-red-600 pl-2" : "hover:bg-gray-800 transition-colors cursor-pointer"}`}>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Users</span>
              </div>
            </div>
          </Link>

          <Link href="/super-control-panel-9xvA3t/comments">
            <div className={`p-3 rounded-lg ${isActive("/super-control-panel-9xvA3t/comments") ? "bg-gray-800 border-l-4 border-red-600 pl-2" : "hover:bg-gray-800 transition-colors cursor-pointer"}`}>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Comments</span>
              </div>
            </div>
          </Link>

          <Link href="/super-control-panel-9xvA3t/analytics">
            <div className={`p-3 rounded-lg ${isActive("/super-control-panel-9xvA3t/analytics") ? "bg-gray-800 border-l-4 border-red-600 pl-2" : "hover:bg-gray-800 transition-colors cursor-pointer"}`}>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Analytics</span>
              </div>
            </div>
          </Link>

          <Link href="/super-control-panel-9xvA3t/notifications">
            <div className={`p-3 rounded-lg ${isActive("/super-control-panel-9xvA3t/notifications") ? "bg-gray-800 border-l-4 border-red-600 pl-2" : "hover:bg-gray-800 transition-colors cursor-pointer"}`}>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">Notifications</span>
              </div>
            </div>
          </Link>

          <Link href="/super-control-panel-9xvA3t/settings">
            <div className={`p-3 rounded-lg ${isActive("/super-control-panel-9xvA3t/settings") ? "bg-gray-800 border-l-4 border-red-600 pl-2" : "hover:bg-gray-800 transition-colors cursor-pointer"}`}>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Settings</span>
              </div>
            </div>
          </Link>

          <Link href="/super-control-panel-9xvA3t/help">
            <div className={`p-3 rounded-lg ${isActive("/super-control-panel-9xvA3t/help") ? "bg-gray-800 border-l-4 border-red-600 pl-2" : "hover:bg-gray-800 transition-colors cursor-pointer"}`}>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Help</span>
              </div>
            </div>
          </Link>
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">A</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">admin</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
        </div>

        <Link href="/">
          <div className="mt-4 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Site</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}