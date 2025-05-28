import { useState, useEffect } from 'react';
import { Link, useLocation } from "wouter";
import { 
  BarChart3, Video, Users, MessageSquare, Activity, 
  Bell, Settings, HelpCircle, ArrowLeft, PlayCircle,
  Menu, X, ChevronRight, LogOut, ShieldAlert
} from "lucide-react";

interface SidebarProps {
  isMobile?: boolean;
  onMobileClose?: () => void;
}

export default function ImprovedAdminSidebar({ isMobile, onMobileClose }: SidebarProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // For mobile screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path: string) => {
    return location.startsWith(path);
  };

  const sidebarClass = `admin-sidebar ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile-sidebar' : ''}`;

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <PlayCircle className="h-5 w-5 text-white" />
          </div>
          {!collapsed && <div className="logo-text">
            <h1>VidVault</h1>
            <p>Admin Panel</p>
          </div>}
        </div>

        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {collapsed ? <Menu /> : <ChevronRight />}
        </button>

        {isMobile && (
          <button className="header-icon-button" onClick={onMobileClose}>
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="sidebar-nav">
        <div className="nav-group">
          {!collapsed && <div className="nav-group-title">Main</div>}

          <div className="nav-item">
            <Link href="/super-control-panel-9xvA3t">
              <a className={`nav-link ${isActive('/super-control-panel-9xvA3t') && !isActive('/super-control-panel-9xvA3t/users') && !isActive('/super-control-panel-9xvA3t/videos') ? 'active' : ''}`}>
                <BarChart3 className="nav-icon" />
                {!collapsed && <span>Dashboard</span>}
              </a>
            </Link>
          </div>

          <div className="nav-item">
            <Link href="/super-control-panel-9xvA3t/videos">
              <a className={`nav-link ${isActive('/super-control-panel-9xvA3t/videos') ? 'active' : ''}`}>
                <Video className="nav-icon" />
                {!collapsed && <span>Videos</span>}
              </a>
            </Link>
          </div>

          <div className="nav-item">
            <Link href="/super-control-panel-9xvA3t/users">
              <a className={`nav-link ${isActive('/super-control-panel-9xvA3t/users') ? 'active' : ''}`}>
                <Users className="nav-icon" />
                {!collapsed && <span>Users</span>}
              </a>
            </Link>
          </div>

          <div className="nav-item">
            <Link href="/super-control-panel-9xvA3t/comments">
              <a className={`nav-link ${isActive('/super-control-panel-9xvA3t/comments') ? 'active' : ''}`}>
                <MessageSquare className="nav-icon" />
                {!collapsed && <span>Comments</span>}
              </a>
            </Link>
          </div>
        </div>

        <div className="nav-group">
          {!collapsed && <div className="nav-group-title">Analysis</div>}

          <div className="nav-item">
            <Link href="/super-control-panel-9xvA3t/analytics">
              <a className={`nav-link ${isActive('/super-control-panel-9xvA3t/analytics') ? 'active' : ''}`}>
                <Activity className="nav-icon" />
                {!collapsed && <span>Analytics</span>}
              </a>
            </Link>
          </div>

          <div className="nav-item">
            <Link href="/super-control-panel-9xvA3t/notifications">
              <a className={`nav-link ${isActive('/super-control-panel-9xvA3t/notifications') ? 'active' : ''}`}>
                <Bell className="nav-icon" />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Notifications</span>
                    <div className="notification-count">3</div>
                  </div>
                )}
                {collapsed && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full"></div>
                )}
              </a>
            </Link>
          </div>
        </div>

        <div className="nav-group">
          {!collapsed && <div className="nav-group-title">System</div>}

          <div className="nav-item">
            <Link href="/super-control-panel-9xvA3t/settings">
              <a className={`nav-link ${isActive('/super-control-panel-9xvA3t/settings') ? 'active' : ''}`}>
                <Settings className="nav-icon" />
                {!collapsed && <span>Settings</span>}
              </a>
            </Link>
          </div>

          <div className="nav-item">
            <Link href="/admin/security">
              <a className={`nav-link ${isActive('/admin/security') ? 'active' : ''}`}>
                <ShieldAlert className="nav-icon" />
                {!collapsed && <span>Security</span>}
              </a>
            </Link>
          </div>

          <div className="nav-item">
            <Link href="/super-control-panel-9xvA3t/help">
              <a className={`nav-link ${isActive('/super-control-panel-9xvA3t/help') ? 'active' : ''}`}>
                <HelpCircle className="nav-icon" />
                {!collapsed && <span>Help</span>}
              </a>
            </Link>
          </div>

          <div className="nav-item">
            <Link href="/manage-control-panel-Xx41q7">
              <a className={`nav-link ${isActive('/manage-control-panel-Xx41q7') ? 'active' : ''}`}>
                <HelpCircle className="nav-icon" />
                {!collapsed && <span>Monetization</span>}
              </a>
            </Link>
          </div>

          <div className="nav-item">
            <Link href="/root-control-panel-9xvA3t">
              <a className={`nav-link ${isActive('/root-control-panel-9xvA3t') ? 'active' : ''}`}>
                <HelpCircle className="nav-icon" />
                {!collapsed && <span>Ad Network</span>}
              </a>
            </Link>
          </div>

          <div className="nav-item">
            <Link href="/">
              <a className="nav-link">
                <ArrowLeft className="nav-icon" />
                {!collapsed && <span>Back to Site</span>}
              </a>
            </Link>
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="user-info">
            <div className="user-avatar">
              <span>A</span>
            </div>
            <div className="user-details">
              <div className="user-name">Admin</div>
              <div className="user-role">Administrator</div>
            </div>
            <button className="header-icon-button ml-2">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="user-avatar">
              <span>A</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}