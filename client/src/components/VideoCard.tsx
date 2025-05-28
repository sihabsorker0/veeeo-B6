import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatNumber, formatTimeAgo, getInitials, getRandomColor } from "@/lib/utils";

interface VideoCardProps {
  video: {
    _id: string;
    title: string;
    thumbnailUrl?: string;
    duration?: string;
    views: number;
    createdAt: string;
    user?: {
      _id: string;
      username: string;
      avatarUrl?: string;
    };
  };
}

export default function VideoCard({ video, compact = false }: { video: any, compact?: boolean }) {
  const {
    _id,
    title,
    thumbnailUrl,
    duration = "0:00",
    views,
    createdAt,
    user
  } = video;

  if (compact) {
    // YouTube-style compact layout for recommendations
    return (
      <Link href={`/video/${_id}`}>
        <div className="flex gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0 w-32 rounded-lg overflow-hidden">
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={title} 
                className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="12" x="3" y="6" rx="2"/>
                  <path d="m12 12 4-2.3v4.6L12 12Z"/>
                </svg>
              </div>
            )}
            <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
              {duration}
            </span>
          </div>

          {/* Video Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-5 line-clamp-2 mb-1 text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <div className="space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer"
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   window.location.href = `/channel/${user?._id || ''}`;
                 }}>
                {user?.username || video?.user?.username || "Unknown Channel"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {formatNumber(views)} views
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {formatTimeAgo(createdAt)}
              </p>
            </div>
          </div>

          {/* Options Menu - Always visible on mobile, hover on desktop */}
          <div className="flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Add to playlist functionality
                }} className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                    <path d="M12 11v4" />
                    <path d="M10 13h4" />
                  </svg>
                  Add to Playlist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Add to watch later functionality
                }} className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save to Watch Later
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Share functionality
                }} className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Link>
    );
  }

  // Regular grid layout for home page
  return (
    <Link href={`/video/${_id}`}>
      <div className="video-card group">
        <div className="relative rounded-lg overflow-hidden">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={title} 
              className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="12" x="3" y="6" rx="2"/>
                <path d="m12 12 4-2.3v4.6L12 12Z"/>
              </svg>
            </div>
          )}
          <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {duration}
          </span>
        </div>
        <div className="mt-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/channel/${user?._id || ''}`;
            }}>
              <Avatar className="h-9 w-9 rounded-full bg-gray-200">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.username} />
                ) : (
                  <AvatarFallback className="text-gray-700 bg-gray-200">
                    {getInitials(user?.username || "")}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm line-clamp-2 mb-1 text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer"
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   window.location.href = `/channel/${user?._id || ''}`;
                 }}>
                {user?.username || video?.user?.username || "Unknown Channel"}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formatNumber(views)} views • {formatTimeAgo(createdAt)}
              </p>
            </div>
            <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Add to playlist functionality
                  }} className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                      <path d="M12 11v4" />
                      <path d="M10 13h4" />
                    </svg>
                    Add to Playlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Add to watch later functionality
                  }} className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save to Watch Later
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Share functionality
                  }} className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}