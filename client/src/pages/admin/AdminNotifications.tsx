import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, Check, Trash2, UserPlus, Upload, Flag, AlertTriangle
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// This would come from an API in a real application
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "New Video Uploaded",
    message: "John Doe uploaded a new video 'How to make a cake'",
    type: "upload",
    read: false,
    date: "2025-05-23T10:30:00"
  },
  {
    id: 2,
    title: "New User Registered",
    message: "Jane Smith created a new account",
    type: "user",
    read: false,
    date: "2025-05-23T09:15:00"
  },
  {
    id: 3,
    title: "Video Reported",
    message: "The video 'Summer Vacation Vlog' was reported for inappropriate content",
    type: "report",
    read: false,
    date: "2025-05-22T16:45:00"
  },
  {
    id: 4,
    title: "System Alert",
    message: "High server load detected, consider optimizing database queries",
    type: "alert",
    read: true,
    date: "2025-05-22T14:20:00"
  },
  {
    id: 5,
    title: "New Video Uploaded",
    message: "Alex Johnson uploaded a new video 'Gaming with friends'",
    type: "upload",
    read: true,
    date: "2025-05-21T18:05:00"
  }
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    browserNotifications: true,
    newUserAlerts: true,
    newVideoAlerts: true,
    reportAlerts: true,
    systemAlerts: true
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== id)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload className="h-4 w-4 text-blue-400" />;
      case 'user':
        return <UserPlus className="h-4 w-4 text-green-400" />;
      case 'report':
        return <Flag className="h-4 w-4 text-red-400" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true
    });
  };

  const handleSettingChange = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader 
            title="Notifications" 
            subtitle="Manage your notifications and preferences"
          />
          
          <div className="p-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center">
                        <h3 className="text-xl font-bold text-white">All Notifications</h3>
                        {unreadCount > 0 && (
                          <Badge className="ml-2 bg-red-600 text-white">
                            {unreadCount} Unread
                          </Badge>
                        )}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="border-gray-700 text-gray-300 hover:bg-gray-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark All Read
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-4 rounded-lg flex items-start ${notification.read ? 'bg-gray-800' : 'bg-gray-700'}`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mr-4">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-white mb-1">
                                  {notification.title}
                                  {!notification.read && (
                                    <span className="inline-block w-2 h-2 bg-red-600 rounded-full ml-2"></span>
                                  )}
                                </h4>
                                <span className="text-xs text-gray-400">
                                  {formatDate(notification.date)}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm">{notification.message}</p>
                            </div>
                            
                            <div className="flex ml-4">
                              {!notification.read && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteNotification(notification.id)}
                                className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No notifications</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Notification Settings</h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-white">Notification Methods</h4>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="email-notifications">Email Notifications</Label>
                            <p className="text-sm text-gray-400">
                              Receive notifications via email
                            </p>
                          </div>
                          <Switch
                            id="email-notifications"
                            checked={settings.emailNotifications}
                            onCheckedChange={() => handleSettingChange('emailNotifications')}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="browser-notifications">Browser Notifications</Label>
                            <p className="text-sm text-gray-400">
                              Show desktop notifications in browser
                            </p>
                          </div>
                          <Switch
                            id="browser-notifications"
                            checked={settings.browserNotifications}
                            onCheckedChange={() => handleSettingChange('browserNotifications')}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium text-white">Notification Types</h4>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="new-user-alerts">New User Alerts</Label>
                            <p className="text-sm text-gray-400">
                              Get notified when new users register
                            </p>
                          </div>
                          <Switch
                            id="new-user-alerts"
                            checked={settings.newUserAlerts}
                            onCheckedChange={() => handleSettingChange('newUserAlerts')}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="new-video-alerts">New Video Alerts</Label>
                            <p className="text-sm text-gray-400">
                              Get notified when new videos are uploaded
                            </p>
                          </div>
                          <Switch
                            id="new-video-alerts"
                            checked={settings.newVideoAlerts}
                            onCheckedChange={() => handleSettingChange('newVideoAlerts')}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="report-alerts">Content Reports</Label>
                            <p className="text-sm text-gray-400">
                              Get notified when content is reported
                            </p>
                          </div>
                          <Switch
                            id="report-alerts"
                            checked={settings.reportAlerts}
                            onCheckedChange={() => handleSettingChange('reportAlerts')}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="system-alerts">System Alerts</Label>
                            <p className="text-sm text-gray-400">
                              Get notified about system issues and updates
                            </p>
                          </div>
                          <Switch
                            id="system-alerts"
                            checked={settings.systemAlerts}
                            onCheckedChange={() => handleSettingChange('systemAlerts')}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Save Notification Settings
                      </Button>
                    </div>
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