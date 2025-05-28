import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, Search, ChevronDown, ChevronRight, 
  Mail, MessageSquare, FileText, Coffee
} from "lucide-react";
import { Input } from "@/components/ui/input";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

interface Article {
  id: string;
  title: string;
  content: string;
}

interface Category {
  id: string;
  title: string;
  icon: JSX.Element;
  articles: Article[];
}

const helpCategories: Category[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <FileText className="h-5 w-5 text-blue-500" />,
    articles: [
      {
        id: "dashboard-overview",
        title: "Dashboard Overview",
        content: `
          <h3>Welcome to the VidVault Admin Dashboard</h3>
          <p>The admin dashboard provides a central place to manage all aspects of your video platform. Here's a quick overview of the main sections:</p>
          <ul>
            <li><strong>Dashboard:</strong> View key statistics and recent activity</li>
            <li><strong>Videos:</strong> Manage all videos on the platform</li>
            <li><strong>Users:</strong> View and manage user accounts</li>
            <li><strong>Comments:</strong> Moderate and manage user comments</li>
            <li><strong>Analytics:</strong> View detailed platform performance metrics</li>
            <li><strong>Settings:</strong> Configure platform settings</li>
          </ul>
          <p>Each section has been designed to be intuitive and easy to use. If you need more specific help, check out the other articles in this help center.</p>
        `
      },
      {
        id: "admin-roles",
        title: "Administrator Roles and Permissions",
        content: `
          <h3>Understanding Admin Roles</h3>
          <p>VidVault supports multiple administrator roles with different permission levels:</p>
          <ul>
            <li><strong>Super Admin:</strong> Has full access to all platform features and settings</li>
            <li><strong>Content Manager:</strong> Can manage videos and comments, but cannot change system settings</li>
            <li><strong>User Manager:</strong> Can manage user accounts but has limited access to content</li>
            <li><strong>Analytics Viewer:</strong> Can view statistics and reports but cannot make changes</li>
          </ul>
          <p>To change an administrator's role, go to Settings > User Management > Admin Users and select the appropriate role from the dropdown menu next to the user's name.</p>
        `
      },
      {
        id: "navigation",
        title: "Navigating the Admin Dashboard",
        content: `
          <h3>Getting Around the Dashboard</h3>
          <p>The main navigation is located on the left side of the screen. Each icon represents a different section of the admin dashboard.</p>
          <p>The top bar contains quick access to notifications, your admin profile, and the logout button.</p>
          <p>Each page has a consistent layout with a title at the top, followed by any relevant filters or controls, and then the main content area.</p>
          <p>You can use the breadcrumb navigation at the top of each page to easily navigate back to previous sections.</p>
        `
      }
    ]
  },
  {
    id: "content-management",
    title: "Content Management",
    icon: <FileText className="h-5 w-5 text-green-500" />,
    articles: [
      {
        id: "managing-videos",
        title: "Managing Videos",
        content: `
          <h3>Video Management Guide</h3>
          <p>The Videos section allows you to manage all videos on the platform:</p>
          <ul>
            <li><strong>Viewing Videos:</strong> All videos are listed in a table with key information like title, views, and upload date</li>
            <li><strong>Editing Videos:</strong> Click the Edit button to modify a video's title, description, or other metadata</li>
            <li><strong>Deleting Videos:</strong> Use the Delete button to remove videos that violate platform policies</li>
            <li><strong>Featuring Videos:</strong> You can feature videos on the homepage by clicking the "Feature" button</li>
          </ul>
          <p>You can also use the filters at the top of the page to find specific videos by category, upload date, or view count.</p>
        `
      },
      {
        id: "comment-moderation",
        title: "Comment Moderation",
        content: `
          <h3>Managing User Comments</h3>
          <p>The Comments section provides tools to moderate user interactions:</p>
          <ul>
            <li><strong>Viewing Comments:</strong> All comments are listed with the associated video and user</li>
            <li><strong>Deleting Comments:</strong> Use the Delete button to remove inappropriate comments</li>
            <li><strong>Filtering Comments:</strong> Use the filters to find comments containing specific words or from specific users</li>
            <li><strong>Bulk Actions:</strong> Select multiple comments to perform actions like deletion or approval in bulk</li>
          </ul>
          <p>The platform automatically flags potentially inappropriate comments for your review.</p>
        `
      }
    ]
  },
  {
    id: "user-management",
    title: "User Management",
    icon: <FileText className="h-5 w-5 text-purple-500" />,
    articles: [
      {
        id: "managing-users",
        title: "Managing User Accounts",
        content: `
          <h3>User Management Guide</h3>
          <p>The Users section allows you to manage all user accounts on the platform:</p>
          <ul>
            <li><strong>Viewing Users:</strong> All users are listed with key information like username, email, and join date</li>
            <li><strong>Banning Users:</strong> Use the Ban button to prevent users who violate platform policies from using the site</li>
            <li><strong>Verifying Users:</strong> You can manually verify users to give them a verified badge on their profile</li>
            <li><strong>Resetting Passwords:</strong> Administrators can trigger password resets for users who are locked out</li>
          </ul>
          <p>You can also view detailed information about a user's activity by clicking on their username.</p>
        `
      },
      {
        id: "user-reports",
        title: "Handling User Reports",
        content: `
          <h3>Managing User Reports</h3>
          <p>When users report content or other users for violations, those reports appear in the Reports section:</p>
          <ul>
            <li><strong>Viewing Reports:</strong> All reports are listed with the reporting user, reported content, and reason</li>
            <li><strong>Resolving Reports:</strong> After investigating, mark reports as resolved with the appropriate action taken</li>
            <li><strong>Contacting Users:</strong> You can contact users involved in reports directly through the platform</li>
          </ul>
          <p>Reports are automatically prioritized based on severity and frequency, with the most urgent appearing at the top.</p>
        `
      }
    ]
  },
  {
    id: "settings",
    title: "Platform Settings",
    icon: <FileText className="h-5 w-5 text-red-500" />,
    articles: [
      {
        id: "general-settings",
        title: "General Platform Settings",
        content: `
          <h3>Configuring General Settings</h3>
          <p>The Settings section allows you to configure various aspects of the platform:</p>
          <ul>
            <li><strong>Site Information:</strong> Update the site name, description, and contact information</li>
            <li><strong>Upload Limits:</strong> Set maximum file sizes and video durations</li>
            <li><strong>Languages:</strong> Configure the available languages for the platform</li>
            <li><strong>Maintenance Mode:</strong> Enable maintenance mode when performing updates</li>
          </ul>
          <p>Remember to save your changes after making modifications to any settings.</p>
        `
      },
      {
        id: "security-settings",
        title: "Security Settings",
        content: `
          <h3>Managing Security Settings</h3>
          <p>The Security settings allow you to configure important security features:</p>
          <ul>
            <li><strong>Password Policies:</strong> Set requirements for user passwords</li>
            <li><strong>Two-Factor Authentication:</strong> Enable or require 2FA for admin accounts</li>
            <li><strong>IP Restrictions:</strong> Limit admin access to specific IP addresses</li>
            <li><strong>Session Timeouts:</strong> Configure how long users can remain logged in</li>
          </ul>
          <p>It's recommended to review security settings regularly to ensure your platform remains protected.</p>
        `
      }
    ]
  }
];

export default function AdminHelp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState("getting-started");
  const [selectedArticleId, setSelectedArticleId] = useState("dashboard-overview");
  
  const toggleCategory = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory("");
    } else {
      setExpandedCategory(categoryId);
      
      // Select the first article in the category
      const category = helpCategories.find(c => c.id === categoryId);
      if (category && category.articles.length > 0) {
        setSelectedArticleId(category.articles[0].id);
      }
    }
  };
  
  const selectArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
  };
  
  const getSelectedArticleContent = () => {
    for (const category of helpCategories) {
      const article = category.articles.find(a => a.id === selectedArticleId);
      if (article) return article;
    }
    return null;
  };
  
  const filteredCategories = searchQuery.trim() === "" 
    ? helpCategories 
    : helpCategories.map(category => {
        const filteredArticles = category.articles.filter(article => 
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return { ...category, articles: filteredArticles };
      }).filter(category => category.articles.length > 0);
  
  const currentArticle = getSelectedArticleContent();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader 
            title="Help Center" 
            subtitle="Find answers to common questions about the admin dashboard"
          />
          
          <div className="p-8">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search for help..." 
                  className="pl-10 pr-4 py-2 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-bold text-white mb-4">Help Topics</h3>
                    
                    <div className="space-y-2">
                      {filteredCategories.map((category) => (
                        <div key={category.id} className="space-y-1">
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              {category.icon}
                              <span className="text-sm font-medium text-white">{category.title}</span>
                            </div>
                            {expandedCategory === category.id ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          
                          {expandedCategory === category.id && (
                            <div className="ml-7 space-y-1 mt-1">
                              {category.articles.map((article) => (
                                <button
                                  key={article.id}
                                  onClick={() => selectArticle(article.id)}
                                  className={`w-full text-left p-2 text-sm rounded-md ${
                                    selectedArticleId === article.id 
                                      ? "bg-blue-600 text-white" 
                                      : "text-gray-300 hover:bg-gray-700"
                                  }`}
                                >
                                  {article.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <h4 className="text-sm font-medium text-white mb-4">Need more help?</h4>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start border-gray-700 text-gray-300">
                          <Mail className="h-4 w-4 mr-2" />
                          Contact Support
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-gray-700 text-gray-300">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Live Chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-3">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    {currentArticle ? (
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-6">{currentArticle.title}</h2>
                        <div 
                          className="prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: currentArticle.content }}
                        />
                        
                        <div className="mt-8 pt-6 border-t border-gray-700 flex justify-between items-center">
                          <div className="text-sm text-gray-400">
                            Last updated: May 20, 2025
                          </div>
                          <div className="flex space-x-4">
                            <Button variant="ghost" className="text-gray-400 hover:text-white">
                              Was this helpful?
                            </Button>
                            <Button variant="outline" className="border-gray-700 text-gray-300">
                              <Coffee className="h-4 w-4 mr-2" />
                              Support this project
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <HelpCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">No article selected</h3>
                        <p className="text-gray-400">Please select a help article from the sidebar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}