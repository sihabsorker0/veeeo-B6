import { 
  Bell, Search, Sun, Moon, Menu, User, ChevronDown, LogOut, Settings, 
  Shield, HelpCircle
} from "lucide-react";
import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onMobileMenuClick?: () => void;
  actions?: ReactNode;
}

export default function ImprovedAdminHeader({ 
  title, 
  subtitle,
  onMobileMenuClick,
  actions
}: AdminHeaderProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="admin-header">
      <div className="flex items-center">
        {onMobileMenuClick && (
          <button 
            className="mr-4 lg:hidden header-icon-button"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        
        <div className="page-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      
      <div className="header-actions">
        <div className="relative max-w-xs hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4" />
          </div>
          <input 
            type="text" 
            placeholder="Search..." 
            className="form-input w-full py-2 pl-10 pr-4 bg-opacity-50 text-sm"
          />
        </div>
        
        <button className="header-icon-button" onClick={toggleTheme} title="Toggle theme">
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
        
        <button className="header-icon-button" title="Notifications">
          <Bell className="h-5 w-5" />
          <span className="notification-badge"></span>
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="profile-dropdown">
              <div className="user-avatar">
                <span>A</span>
              </div>
              <span className="hidden md:block ml-2 mr-1 text-sm font-medium">Admin</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mr-2 bg-[var(--admin-card-bg)] border-[var(--admin-border)] text-[var(--admin-text-primary)]">
            <div className="flex items-center px-3 py-3">
              <div className="user-avatar mr-3">
                <span>A</span>
              </div>
              <div>
                <p className="text-sm font-semibold">Admin</p>
                <p className="text-xs text-[var(--admin-text-secondary)]">admin@vidvault.com</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-[var(--admin-border)]" />
            <DropdownMenuItem className="hover:bg-[var(--admin-hover-bg)] focus:bg-[var(--admin-hover-bg)] cursor-pointer py-2.5">
              <User className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[var(--admin-hover-bg)] focus:bg-[var(--admin-hover-bg)] cursor-pointer py-2.5">
              <Settings className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[var(--admin-hover-bg)] focus:bg-[var(--admin-hover-bg)] cursor-pointer py-2.5">
              <Shield className="mr-2 h-4 w-4" />
              <span>Security</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[var(--admin-hover-bg)] focus:bg-[var(--admin-hover-bg)] cursor-pointer py-2.5">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help Center</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[var(--admin-border)]" />
            <DropdownMenuItem className="hover:bg-[rgba(255,0,0,0.1)] focus:bg-[rgba(255,0,0,0.1)] cursor-pointer text-[var(--admin-accent)] py-2.5">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {actions && (
          <div className="ml-4 border-l border-[var(--admin-border)] pl-4 hidden md:flex">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}