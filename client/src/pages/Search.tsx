import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import VideoModal from "@/components/VideoModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search as SearchIcon, 
  Filter, 
  SlidersHorizontal,
  Calendar,
  Eye,
  ThumbsUp,
  Clock
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Search() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [duration, setDuration] = useState("any");
  const [uploadDate, setUploadDate] = useState("any");

  // Get search query and filters from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const urlCategory = urlParams.get('category');
    const urlSort = urlParams.get('sort');
    
    if (query) {
      setSearchQuery(query);
    }
    if (urlCategory) {
      setCategory(urlCategory);
    } else {
      setCategory('all');
    }
    if (urlSort) {
      setSortBy(urlSort);
    } else {
      setSortBy('relevance');
    }
  }, [location]);

  // Build query parameters for API
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery);
    if (category !== 'all') params.append('category', category);
    if (sortBy !== 'relevance') params.append('sort', sortBy);
    return params.toString();
  };

  const queryParams = buildQueryParams();

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/videos', searchQuery, category, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (category !== 'all') params.append('category', category);
      if (sortBy !== 'relevance') params.append('sort', sortBy);
      
      const queryString = params.toString();
      const response = await fetch(`/api/videos${queryString ? `?${queryString}` : ''}`);
      return response.json();
    },
    enabled: true,
    refetchOnWindowFocus: false
  });

  const videos = data?.videos || [];

  const openVideoModal = (video: any) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };



  const clearFilters = () => {
    setCategory("all");
    setSortBy("relevance");
    setDuration("any");
    setUploadDate("any");
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "music", label: "Music" },
    { value: "gaming", label: "Gaming" },
    { value: "education", label: "Education" },
    { value: "entertainment", label: "Entertainment" },
    { value: "sports", label: "Sports" },
    { value: "technology", label: "Technology" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "news", label: "News" },
    { value: "comedy", label: "Comedy" },
    { value: "cooking", label: "Cooking" }
  ];

  return (
    <>
      <div className="p-4 space-y-6">
        {/* Search Header */}
        <div className="space-y-4">
          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {searchQuery && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Search results for: <span className="font-medium">"{searchQuery}"</span>
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {showFilters && <span className="text-xs">(Hide)</span>}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sort by</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="newest">Upload date (newest)</SelectItem>
                      <SelectItem value="oldest">Upload date (oldest)</SelectItem>
                      <SelectItem value="views">View count</SelectItem>
                      <SelectItem value="likes">Most liked</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Duration</label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any duration</SelectItem>
                      <SelectItem value="short">Under 4 minutes</SelectItem>
                      <SelectItem value="medium">4-20 minutes</SelectItem>
                      <SelectItem value="long">Over 20 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Upload date</label>
                  <Select value={uploadDate} onValueChange={setUploadDate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any time</SelectItem>
                      <SelectItem value="hour">Last hour</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="year">This year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="rounded-lg overflow-hidden bg-lightCard dark:bg-darkCard">
                  <Skeleton className="w-full aspect-video" />
                  <div className="p-3">
                    <div className="flex">
                      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0 mr-3" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {data?.total || videos.length} results found
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Filter className="h-4 w-4 text-black dark:text-gray-400" />
                  Sorted by {sortBy === 'relevance' ? 'Relevance' : sortBy === 'newest' ? 'Newest' : sortBy === 'views' ? 'Views' : sortBy === 'likes' ? 'Likes' : 'Duration'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video: any) => (
                  <div key={video._id} onClick={() => openVideoModal(video)} className="cursor-pointer">
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <SearchIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">
                  {searchQuery ? "No results found" : "Search for videos"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery 
                    ? `Try searching for something else or check your spelling`
                    : "Enter a search term to find videos"
                  }
                </p>
                {searchQuery && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Suggestions:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={() => setSearchQuery("music")}>
                        Music
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSearchQuery("gaming")}>
                        Gaming
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSearchQuery("tutorial")}>
                        Tutorial
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSearchQuery("comedy")}>
                        Comedy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
        />
      )}
    </>
  );
}