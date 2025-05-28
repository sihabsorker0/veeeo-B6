import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, Save, Database, Shield, User, LucideGlobe, 
  Paintbrush, FileText, Lock, Cloud, Mail, LayoutGrid
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

export default function AdminSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "VidVault",
    siteDescription: "A modern video sharing platform",
    contactEmail: "admin@vidvault.com",
    maxUploadSize: "500",
    defaultLanguage: "en",
    timeZone: "UTC",
    maintenance: false
  });
  
  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "dark",
    primaryColor: "#ff0000",
    accentColor: "#3b82f6",
    logo: "/logo.png",
    favicon: "/favicon.ico",
    customCSS: "",
    videoPlayerColor: "#ff0000"
  });
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordPolicy: "strong",
    sessionTimeout: "60",
    ipRestriction: false,
    contentFiltering: true,
    automaticBan: false
  });
  
  // API settings
  const [apiSettings, setApiSettings] = useState({
    enableAPI: true,
    apiRateLimit: "100",
    apiKeys: "3",
    webhooksEnabled: true
  });
  
  // The save settings function (would connect to an API in a real app)
  const saveSettings = (type: string) => {
    // This would be an API call in a real app
    toast({
      title: "Settings Saved",
      description: `Your ${type} settings have been saved successfully.`,
    });
  };
  
  const handleGeneralChange = (field: string, value: string | boolean) => {
    setGeneralSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleAppearanceChange = (field: string, value: string) => {
    setAppearanceSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSecurityChange = (field: string, value: string | boolean) => {
    setSecuritySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleApiChange = (field: string, value: string | boolean) => {
    setApiSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader 
            title="Settings" 
            subtitle="Configure your platform settings"
          />
          
          <div className="p-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="bg-gray-700 p-1">
                    <TabsTrigger value="general" className="data-[state=active]:bg-gray-600">
                      <LucideGlobe className="h-4 w-4 mr-2" />
                      General
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="data-[state=active]:bg-gray-600">
                      <Paintbrush className="h-4 w-4 mr-2" />
                      Appearance
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-gray-600">
                      <Shield className="h-4 w-4 mr-2" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger value="api" className="data-[state=active]:bg-gray-600">
                      <FileText className="h-4 w-4 mr-2" />
                      API
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* General Settings */}
                  <TabsContent value="general" className="space-y-6">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="site-name">Site Name</Label>
                          <Input 
                            id="site-name" 
                            value={generalSettings.siteName}
                            onChange={(e) => handleGeneralChange('siteName', e.target.value)}
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="contact-email">Contact Email</Label>
                          <Input 
                            id="contact-email" 
                            type="email"
                            value={generalSettings.contactEmail}
                            onChange={(e) => handleGeneralChange('contactEmail', e.target.value)}
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="site-description">Site Description</Label>
                        <Input
                          id="site-description"
                          value={generalSettings.siteDescription}
                          onChange={(e) => handleGeneralChange('siteDescription', e.target.value)}
                          className="bg-gray-900 border-gray-700"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="max-upload">Maximum Upload Size (MB)</Label>
                          <Input
                            id="max-upload"
                            type="number"
                            value={generalSettings.maxUploadSize}
                            onChange={(e) => handleGeneralChange('maxUploadSize', e.target.value)}
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="default-language">Default Language</Label>
                          <Select 
                            value={generalSettings.defaultLanguage}
                            onValueChange={(value) => handleGeneralChange('defaultLanguage', value)}
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-700">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="ja">Japanese</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Time Zone</Label>
                          <Select 
                            value={generalSettings.timeZone}
                            onValueChange={(value) => handleGeneralChange('timeZone', value)}
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-700">
                              <SelectValue placeholder="Select time zone" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="EST">Eastern Time</SelectItem>
                              <SelectItem value="CST">Central Time</SelectItem>
                              <SelectItem value="MST">Mountain Time</SelectItem>
                              <SelectItem value="PST">Pacific Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-8">
                          <Switch
                            id="maintenance-mode"
                            checked={generalSettings.maintenance}
                            onCheckedChange={(checked) => handleGeneralChange('maintenance', checked)}
                          />
                          <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={() => saveSettings('general')} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        Save General Settings
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Appearance Settings */}
                  <TabsContent value="appearance" className="space-y-6">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="theme">Theme</Label>
                          <Select 
                            value={appearanceSettings.theme}
                            onValueChange={(value) => handleAppearanceChange('theme', value)}
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-700">
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="system">System Default</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="primary-color">Primary Color</Label>
                          <div className="flex">
                            <Input
                              id="primary-color"
                              type="text"
                              value={appearanceSettings.primaryColor}
                              onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                              className="bg-gray-900 border-gray-700 rounded-r-none flex-1"
                            />
                            <div 
                              className="w-10 h-10 rounded-r-md border border-l-0 border-gray-700"
                              style={{ backgroundColor: appearanceSettings.primaryColor }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="accent-color">Accent Color</Label>
                          <div className="flex">
                            <Input
                              id="accent-color"
                              type="text"
                              value={appearanceSettings.accentColor}
                              onChange={(e) => handleAppearanceChange('accentColor', e.target.value)}
                              className="bg-gray-900 border-gray-700 rounded-r-none flex-1"
                            />
                            <div 
                              className="w-10 h-10 rounded-r-md border border-l-0 border-gray-700"
                              style={{ backgroundColor: appearanceSettings.accentColor }}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="player-color">Video Player Color</Label>
                          <div className="flex">
                            <Input
                              id="player-color"
                              type="text"
                              value={appearanceSettings.videoPlayerColor}
                              onChange={(e) => handleAppearanceChange('videoPlayerColor', e.target.value)}
                              className="bg-gray-900 border-gray-700 rounded-r-none flex-1"
                            />
                            <div 
                              className="w-10 h-10 rounded-r-md border border-l-0 border-gray-700"
                              style={{ backgroundColor: appearanceSettings.videoPlayerColor }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="logo-path">Logo Path</Label>
                          <Input
                            id="logo-path"
                            value={appearanceSettings.logo}
                            onChange={(e) => handleAppearanceChange('logo', e.target.value)}
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="favicon-path">Favicon Path</Label>
                          <Input
                            id="favicon-path"
                            value={appearanceSettings.favicon}
                            onChange={(e) => handleAppearanceChange('favicon', e.target.value)}
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="custom-css">Custom CSS</Label>
                        <textarea
                          id="custom-css"
                          rows={5}
                          value={appearanceSettings.customCSS}
                          onChange={(e) => handleAppearanceChange('customCSS', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white"
                          placeholder="Add your custom CSS here..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={() => saveSettings('appearance')} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        Save Appearance Settings
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Security Settings */}
                  <TabsContent value="security" className="space-y-6">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="password-policy">Password Policy</Label>
                          <Select 
                            value={securitySettings.passwordPolicy}
                            onValueChange={(value) => handleSecurityChange('passwordPolicy', value)}
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-700">
                              <SelectValue placeholder="Select policy" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              <SelectItem value="simple">Simple (min 6 characters)</SelectItem>
                              <SelectItem value="medium">Medium (min 8 characters, 1 number)</SelectItem>
                              <SelectItem value="strong">Strong (min 10 characters, uppercase, number, symbol)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                          <Input
                            id="session-timeout"
                            type="number"
                            value={securitySettings.sessionTimeout}
                            onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="two-factor"
                            checked={securitySettings.twoFactorAuth}
                            onCheckedChange={(checked) => handleSecurityChange('twoFactorAuth', checked)}
                          />
                          <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="ip-restriction"
                            checked={securitySettings.ipRestriction}
                            onCheckedChange={(checked) => handleSecurityChange('ipRestriction', checked)}
                          />
                          <Label htmlFor="ip-restriction">IP Address Restriction</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="content-filter"
                            checked={securitySettings.contentFiltering}
                            onCheckedChange={(checked) => handleSecurityChange('contentFiltering', checked)}
                          />
                          <Label htmlFor="content-filter">Content Filtering</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="auto-ban"
                            checked={securitySettings.automaticBan}
                            onCheckedChange={(checked) => handleSecurityChange('automaticBan', checked)}
                          />
                          <Label htmlFor="auto-ban">Automatic Ban for Repeated Violations</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={() => saveSettings('security')} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        Save Security Settings
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* API Settings */}
                  <TabsContent value="api" className="space-y-6">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="api-rate">API Rate Limit (requests per minute)</Label>
                          <Input
                            id="api-rate"
                            type="number"
                            value={apiSettings.apiRateLimit}
                            onChange={(e) => handleApiChange('apiRateLimit', e.target.value)}
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="api-keys">Maximum API Keys per User</Label>
                          <Input
                            id="api-keys"
                            type="number"
                            value={apiSettings.apiKeys}
                            onChange={(e) => handleApiChange('apiKeys', e.target.value)}
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="enable-api"
                            checked={apiSettings.enableAPI}
                            onCheckedChange={(checked) => handleApiChange('enableAPI', checked)}
                          />
                          <Label htmlFor="enable-api">Enable API Access</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="enable-webhooks"
                            checked={apiSettings.webhooksEnabled}
                            onCheckedChange={(checked) => handleApiChange('webhooksEnabled', checked)}
                          />
                          <Label htmlFor="enable-webhooks">Enable Webhooks</Label>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-900 rounded-md border border-gray-700">
                        <h4 className="text-sm font-medium text-white mb-2">API Documentation</h4>
                        <p className="text-sm text-gray-400 mb-2">
                          Your API base URL is: <code className="bg-gray-800 px-1 py-0.5 rounded">https://api.vidvault.com/v1</code>
                        </p>
                        <Button variant="outline" size="sm" className="mt-2 border-gray-700 text-gray-300 hover:bg-gray-800">
                          View API Documentation
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={() => saveSettings('api')} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        Save API Settings
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}