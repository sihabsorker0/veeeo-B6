import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContextFixed";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Fetch user subscriptions if authenticated
  const { data: subscriptionsData, isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ['/api/users/subscriptions'],
    enabled: isAuthenticated,
  });

  const handleLinkClick = () => {
    closeSidebar();
  };

  const navigateTo = (path: string) => {
    handleLinkClick();
    setLocation(path);
  };

  return (
    <aside 
      id="sidebar" 
      className={cn(
        "fixed left-0 top-14 bottom-0 w-60 bg-white dark:bg-darkBg transition-transform duration-300 z-10 overflow-y-auto",
        isOpen ? "lg:translate-x-0" : "-translate-x-full",
        isOpen && "transform-none"
      )}
    >
      <nav className="py-2">
        <div className="px-2">
          <div
            className={cn("flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer", 
              location === "/" && "font-medium bg-gray-100 dark:bg-gray-800")}
            onClick={() => navigateTo('/')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </div>
          <div
            className={cn("flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer", 
              location === "/explore" && "font-medium bg-gray-100 dark:bg-gray-800")}
            onClick={() => navigateTo('/explore')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
            <span>Explore</span>
          </div>
          <div
            className={cn("flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer", 
              location === "/subscriptions" && "font-medium bg-gray-100 dark:bg-gray-800")}
            onClick={() => navigateTo('/subscriptions')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Subscriptions</span>
          </div>
        </div>
        
        <div className="mt-2 px-2">
          <div
            className={cn("flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer", 
              location === "/library" && "font-medium bg-gray-100 dark:bg-gray-800")}
            onClick={() => navigateTo('/library')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.29 7 12 12 20.71 7"/>
              <line x1="12" y1="22" y2="12" x2="12"/>
            </svg>
            <span>Library</span>
          </div>
          <div
            className={cn("flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer", 
              location === "/history" && "font-medium bg-gray-100 dark:bg-gray-800")}
            onClick={() => navigateTo('/history')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="12 8 12 12 14 14"/>
              <path d="M3.05 11a9 9 0 1 1 .5 4"/>
              <path d="M3 16v-6h6"/>
            </svg>
            <span>History</span>
          </div>
          <div
            className={cn("flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer", 
              location === "/watch-later" && "font-medium bg-gray-100 dark:bg-gray-800")}
            onClick={() => navigateTo('/watch-later')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Watch Later</span>
          </div>
          <div
            className={cn("flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer", 
              location === "/liked-videos" && "font-medium bg-gray-100 dark:bg-gray-800")}
            onClick={() => navigateTo('/liked-videos')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 10v12"/>
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
            </svg>
            <span>Liked Videos</span>
          </div>
          <div
            className={cn("flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer", 
              location === "/playlists" && "font-medium bg-gray-100 dark:bg-gray-800")}
            onClick={() => navigateTo('/playlists')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
              <path d="M12 11v4"/>
              <path d="M10 13h4"/>
            </svg>
            <span>Playlists</span>
          </div>
        </div>
        
        {isAuthenticated && (
          <div className="mt-2 pt-2 px-2">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 uppercase">Subscriptions</h3>
            
            {isLoadingSubscriptions ? (
              <div className="space-y-2 px-3">
                <div className="flex items-center">
                  <Skeleton className="h-6 w-6 rounded-full mr-4" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-6 w-6 rounded-full mr-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                No subscriptions yet
              </p>
            )}
          </div>
        )}
        
        <div className="mt-2 pt-2 px-2">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 uppercase">More from Veeeo</h3>
          <div className="flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
               onClick={() => navigateTo('/settings')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Settings</span>
          </div>
          <div className="flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
               onClick={() => navigateTo('/help')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <path d="M12 17h.01"/>
            </svg>
            <span>Help</span>
          </div>
          <div className="flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
               onClick={() => navigateTo('/feedback')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            <span>Send Feedback</span>
          </div>
          
          
          {user?.isAdmin && (
            <div className="mt-2 pt-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 uppercase">Admin</h3>
              <div className="flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => navigateTo('/admin')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Dashboard</span>
              </div>
              <div className="flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => navigateTo('/admin/adnetwork')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 2H8a2 2 0 0 0-2 2v3h12V4a2 2 0 0 0-2-2z" />
                </svg>
                <span>Ad Network</span>
              </div>
              <div className="flex items-center gap-5 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => navigateTo('/admin/withdraw')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Withdrawals</span>
              </div>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}