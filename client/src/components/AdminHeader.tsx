import { Bell, ChevronLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ReactNode } from "react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  actions?: ReactNode;
}

export default function AdminHeader({ 
  title, 
  subtitle, 
  backLink,
  actions
}: AdminHeaderProps) {
  return (
    <div className="border-b border-gray-800 bg-gray-900 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {backLink && (
            <Link href={backLink}>
              <Button variant="ghost" size="icon" className="mr-4 text-gray-400 hover:text-white">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
            </Button>
            
            <div className="text-right mr-2">
              <p className="text-sm text-white">Welcome, admin</p>
            </div>
            
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400">
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
          
          {actions && (
            <div className="flex gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}