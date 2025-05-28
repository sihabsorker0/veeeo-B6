import { Link, useLocation } from "wouter";
import { Home, Search, Upload, Library, User, Bell, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContextFixed";
import { useState } from "react";
import AuthModal from "@/components/AuthModal";
import UploadModal from "@/components/UploadModal";

export default function MobileMenubar() {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const menuItems = [
    {
      icon: Home,
      label: "Home",
      href: "/",
      active: location === "/"
    },
    {
      icon: Search,
      label: "Explore",
      href: "/explore",
      active: location === "/explore"
    },
    {
      icon: Upload,
      label: "Upload",
      href: "#",
      active: false,
      onClick: () => {
        if (isAuthenticated) {
          setIsUploadModalOpen(true);
        } else {
          setIsAuthModalOpen(true);
        }
      }
    },
    {
      icon: Library,
      label: "Library",
      href: "/library",
      active: location === "/library"
    },
    {
      icon: User,
      label: "Profile",
      href: isAuthenticated ? `/channel/${user?._id}` : "#",
      active: location.startsWith("/channel/") || location === "/settings",
      onClick: !isAuthenticated ? () => setIsAuthModalOpen(true) : undefined
    }
  ];

  // Don't show on admin routes
  if (location.startsWith('/admin') || location.startsWith('/monetization') || location.startsWith('/adnetwork')) {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-darkBg border-t border-gray-200 dark:border-gray-800 md:hidden">
        <div className="grid grid-cols-5 gap-0 py-2 h-16">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            
            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`flex flex-col items-center justify-center h-full ${
                    item.active
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <IconComponent 
                    size={20} 
                    className={item.active ? "stroke-2" : "stroke-1.5"} 
                  />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link key={item.label} href={item.href}>
                <div
                  className={`flex flex-col items-center justify-center h-full ${
                    item.active
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <IconComponent 
                    size={20} 
                    className={item.active ? "stroke-2" : "stroke-1.5"} 
                  />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind the bottom nav */}
      <div className="h-16 md:hidden" />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </>
  );
}