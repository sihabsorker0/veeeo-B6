import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, BarChart, Users, Target, Plus, Video, ExternalLink, Activity, TrendingUp, PlayCircle } from "lucide-react";

interface AdStats {
  totalRevenue: number;
  activeCampaigns: number;
  totalClicks: number;
  totalImpressions: number;
  ctr: number;
  campaigns: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    budget: number;
    spent: number;
    impressions: number;
    clicks: number;
    ctr: number;
    startDate: string;
    endDate: string;
  }>;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [createOrderData, setCreateOrderData] = useState({
    name: "",
    type: "pre-roll",
    budget: 0,
    targetUrl: "",
    content: null as File | null,
    cpm: 0,
    companyPercentage: 30,
    creatorRevenue: 0
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchId, setSearchId] = useState("");

  const handleCreateCampaign = async () => {
    try {
      const formData = new FormData();
      formData.append('name', createOrderData.name);
      formData.append('type', createOrderData.type);
      formData.append('budget', createOrderData.budget.toString());
      formData.append('targetUrl', createOrderData.targetUrl || '#');
      formData.append('cpm', createOrderData.cpm.toString());
      formData.append('creatorRevenue', createOrderData.creatorRevenue.toString());
      formData.append('companyPercentage', createOrderData.companyPercentage.toString());
      formData.append('description', `${createOrderData.type} বিজ্ঞাপন - ${createOrderData.name}`);

      // Always check if content exists and append as adContent
      if (createOrderData.content instanceof File) {
        formData.append('adContent', createOrderData.content);
      }

      // Use FormData for file upload
      const response = await fetch('/api/admin/ads/create', {
        method: 'POST',
        body: formData // Remove Content-Type header to let browser set it for FormData
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.status === 201 || response.ok) {
        try {
          const result = await response.json();
          console.log('Campaign created successfully:', result);
          alert('✅ বিজ্ঞাপন সফলভাবে তৈরি হয়েছে!');

          // Reset form
          setCreateOrderData({
            name: "",
            type: "banner",
            budget: 0,
            targetUrl: "",
            content: null,
            cpm: 0,
            creatorRevenue: 0
          });

          // Refresh stats
          window.location.reload();
        } catch (parseError) {
          console.log('Response parsing error, but campaign was created successfully');
          alert('✅ বিজ্ঞাপন সফলভাবে তৈরি হয়েছে!');
          window.location.reload();
        }
      } else {
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          alert('❌ বিজ্ঞাপন তৈরিতে সমস্যা: ' + errorText);
        } catch {
          alert('❌ বিজ্ঞাপন তৈরিতে সমস্যা হয়েছে।');
        }
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    }
  };

  // Stats query with polling
  const { data: stats } = useQuery<AdStats>({
    queryKey: ["/api/admin/ads/stats"],
    refetchInterval: 5000, // Poll every 5 seconds
    queryFn: async () => {
      // Fetch the campaign data from the server
      const response = await fetch('/api/admin/ads/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch ad statistics');
      }

      // Get the raw data
      const rawData = await response.json();

      // Use real data from database
      rawData.campaigns = rawData.campaigns.map(campaign => {
        return {
          ...campaign,
          targetImpressions: campaign.targetImpressions || 0,
          remainingImpressions: campaign.remainingImpressions || 0,
          cpm: campaign.cpm || 0,
          revenuePerView: campaign.revenuePerView || 0,
          companyPercentage: campaign.companyPercentage
        };
      });

      return rawData;
    }
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        {/* Ad Network Sidebar */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Ad Network</h1>
                <p className="text-xs text-gray-400">Dashboard</p>
              </div>
            </div>

            <nav className="space-y-2">
              <div className="bg-gray-800 rounded-lg p-3 border-l-4 border-red-600">
                <div className="flex items-center gap-3 text-white">
                  <BarChart className="h-4 w-4" />
                  <span className="text-sm font-medium">Overview</span>
                </div>
              </div>

              <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Campaigns</span>
                </div>
              </div>

              <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Analytics</span>
                </div>
              </div>

              <div className="p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 text-gray-400 hover:text-white">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Advertisers</span>
                </div>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="border-b border-gray-800 bg-gray-900 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Ad Network Dashboard</h1>
                <p className="text-gray-400 mt-1">Manage your advertising campaigns and revenue</p>
              </div>
              <div className="flex gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create New Advertisement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-300">Campaign Name</Label>
                        <Input 
                          id="name" 
                          placeholder="Enter campaign name" 
                          className="bg-gray-700 border-gray-600 text-white"
                          value={createOrderData.name}
                          onChange={(e) => setCreateOrderData(prev => ({...prev, name: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="adType" className="text-gray-300">Ad Type</Label>
                        <Select defaultValue="pre-roll" onValueChange={(value) => setCreateOrderData(prev => ({...prev, type: value}))}>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Select ad type" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600 text-white">
                            <SelectItem value="pre-roll">Pre-roll (ভিডিও শুরুর আগে)</SelectItem>
                            <SelectItem value="mid-roll">Mid-roll (ভিডিও মাঝখানে)</SelectItem>
                            <SelectItem value="post-roll">Post-roll (ভিডিও শেষে)</SelectItem>
                            <SelectItem value="banner">Banner (ওয়েবসাইট ব্যানার)</SelectItem>
                            <SelectItem value="overlay">Overlay (ভিডিও উপরে)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="adContent" className="text-gray-300">Ad Content File (Image/Video)</Label>
                        <Input 
                          id="adContent" 
                          type="file" 
                          accept="image/*,video/*"
                          className="bg-gray-700 border-gray-600 text-white"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCreateOrderData(prev => ({...prev, content: file}));
                            }
                          }}
                        />
                        {createOrderData.content && (
                          <p className="text-sm text-gray-400 mt-1">
                            Selected: {createOrderData.content.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="targetUrl" className="text-gray-300">Target URL</Label>
                        <Input 
                          id="targetUrl" 
                          placeholder="Enter target URL" 
                          className="bg-gray-700 border-gray-600 text-white"
                          value={createOrderData.targetUrl}
                          onChange={(e) => setCreateOrderData(prev => ({...prev, targetUrl: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="budget" className="text-gray-300">Budget (USD)</Label>
                        <Input 
                          id="budget" 
                          type="number" 
                          placeholder="Enter budget" 
                          className="bg-gray-700 border-gray-600 text-white"
                          value={createOrderData.budget}
                          onChange={(e) => setCreateOrderData(prev => ({...prev, budget: parseFloat(e.target.value) || 0}))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpm" className="text-gray-300">CPM (Cost per 1000 Impressions)</Label>
                        <Input 
                          id="cpm" 
                          type="number" 
                          placeholder="Enter CPM" 
                          className="bg-gray-700 border-gray-600 text-white"
                          value={createOrderData.cpm}
                          onChange={(e) => setCreateOrderData(prev => ({...prev, cpm: parseFloat(e.target.value) || 0}))}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Target Impressions</Label>
                        <div className="bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                          {createOrderData.cpm > 0 ? Math.floor((createOrderData.budget / createOrderData.cpm) * 1000) : 0} impressions
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Calculated based on budget and CPM</p>
                      </div>
                      <div>
                        <Label htmlFor="companyPercentage" className="text-gray-300">Company Percentage (%)</Label>
                        <Input 
                          id="companyPercentage" 
                          type="number" 
                          placeholder="Enter company percentage" 
                          className="bg-gray-700 border-gray-600 text-white"
                          min="0"
                          max="100"
                          value={createOrderData.companyPercentage}
                          onChange={(e) => {
                            const percentage = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                            const creatorPercentage = (100 - percentage) / 100;
                            const revenuePerView = (createOrderData.cpm / 1000) * creatorPercentage;

                            setCreateOrderData(prev => ({
                              ...prev, 
                              companyPercentage: percentage,
                              creatorRevenue: revenuePerView
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Creator Revenue (USD per view)</Label>
                        <div className="bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                          ${createOrderData.creatorRevenue.toFixed(6)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Auto-calculated based on CPM and company percentage</p>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancel</Button>
                        <Button 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleCreateCampaign}
                        >
                          Create Campaign
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700 text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="data-[state=active]:bg-gray-700 text-white">
                  Campaigns
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700 text-white">
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                          <p className="text-3xl font-bold text-white">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
                          <p className="text-xs text-gray-500 mt-1">+0% from last month</p>
                        </div>
                        <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Total Impressions</p>
                          <p className="text-3xl font-bold text-white">{stats?.totalImpressions?.toLocaleString() || '0'}</p>
                          <p className="text-xs text-gray-500 mt-1">All time impressions</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                          <Target className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Active Campaigns</p>
                          <p className="text-3xl font-bold text-white">{stats?.activeCampaigns || 0}</p>
                          <p className="text-xs text-gray-500 mt-1">+0% from last month</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                          <Target className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Total Clicks</p>
                          <p className="text-3xl font-bold text-white">{stats?.totalClicks?.toLocaleString() || '0'}</p>
                          <p className="text-xs text-gray-500 mt-1">+0% from last month</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                          <ExternalLink className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">CTR</p>
                          <p className="text-3xl font-bold text-white">{stats?.ctr?.toFixed(2) || '0.00'}%</p>
                          <p className="text-xs text-gray-500 mt-1">+0% from last month</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                          <BarChart className="h-6 w-6 text-yellow-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Campaigns</CardTitle>
                    <p className="text-gray-400">Your latest advertising campaigns performance</p>
                  </CardHeader>
                  <CardContent>
                    {stats?.campaigns?.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700">
                            <TableHead className="text-gray-400">Campaign</TableHead>
                            <TableHead className="text-gray-400">Type</TableHead>
                            <TableHead className="text-gray-400">Status</TableHead>
                            <TableHead className="text-gray-400">Budget</TableHead>
                            <TableHead className="text-gray-400">Spent</TableHead>
                            <TableHead className="text-gray-400">Impressions</TableHead>
                            <TableHead className="text-gray-400">Target</TableHead>
                            <TableHead className="text-gray-400">Remaining</TableHead>
                            <TableHead className="text-gray-400">CPM</TableHead>
                            <TableHead className="text-gray-400">Revenue/View</TableHead>
                            <TableHead className="text-gray-400">Company %</TableHead>
                            <TableHead className="text-gray-400">CTR</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.campaigns.map((campaign) => {
                            const progress = (campaign.impressions / campaign.targetImpressions) * 100;

                            let status = campaign.status;
                            if (campaign.impressions >= campaign.targetImpressions) {
                              status = 'completed';
                            } else if (!campaign.isActive) {
                              status = 'paused';
                            }

                            return (
                              <TableRow key={campaign.id} className="border-gray-700">
                                <TableCell className="text-white">{campaign.title}</TableCell>
                                <TableCell className="text-gray-400">{campaign.type}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      status === 'active' ? 'default' :
                                      status === 'completed' ? 'success' :
                                      'secondary'
                                    }
                                    className={
                                      status === 'active' ? 'bg-green-600' :
                                      status === 'completed' ? 'bg-blue-600' :
                                      'bg-gray-600'
                                    }
                                  >
                                    {status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-400">${campaign.budget}</TableCell>
                                <TableCell className="text-gray-400">${campaign.spent}</TableCell>
                                <TableCell className="text-gray-400">
                                  <div>
                                    <span>{campaign.impressions.toLocaleString()}</span>
                                    <div className="w-full bg-gray-700 h-1 mt-1 rounded-full overflow-hidden">
                                      <div 
                                        className="bg-blue-600 h-full rounded-full" 
                                        style={{ width: `${Math.min(100, progress)}%` }}
                                      />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-400">{campaign.targetImpressions?.toLocaleString()}</TableCell>
                                <TableCell className="text-gray-400">{campaign.remainingImpressions?.toLocaleString()}</TableCell>
                                <TableCell className="text-gray-400">${campaign.cpm}</TableCell>
                                <TableCell className="text-gray-400">${campaign.revenuePerView?.toFixed(6)}</TableCell>
                                <TableCell className="text-gray-400">{campaign.companyPercentage}%</TableCell>
                                <TableCell className="text-gray-400">{campaign.ctr}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No campaigns found</p>
                        <p>Create your first ad campaign to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="campaigns">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white">Campaign Management</CardTitle>
                      <p className="text-gray-400">Create and manage your advertising campaigns</p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex gap-2 items-center">
                        <Label className="text-gray-400">Status:</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600 text-white">
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Label className="text-gray-400">Search ID:</Label>
                        <Input
                          type="text"
                          placeholder="Enter campaign ID"
                          value={searchId}
                          onChange={(e) => setSearchId(e.target.value)}
                          className="w-48 bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          New Campaign
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Create New Advertisement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Same form as the one in the header */}
                          <div>
                            <Label htmlFor="name2" className="text-gray-300">Campaign Name</Label>
                            <Input 
                              id="name2" 
                              placeholder="Enter campaign name" 
                              className="bg-gray-700 border-gray-600 text-white"
                              value={createOrderData.name}
                              onChange={(e) => setCreateOrderData(prev => ({...prev, name: e.target.value}))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="adType2" className="text-gray-300">Ad Type</Label>
                            <Select defaultValue="pre-roll" onValueChange={(value) => setCreateOrderData(prev => ({...prev, type: value}))}>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Select ad type" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                                <SelectItem value="pre-roll">Pre-roll (ভিডিও শুরুর আগে)</SelectItem>
                                <SelectItem value="mid-roll">Mid-roll (ভিডিও মাঝখানে)</SelectItem>
                                <SelectItem value="post-roll">Post-roll (ভিডিও শেষে)</SelectItem>
                                <SelectItem value="banner">Banner (ওয়েবসাইট ব্যানার)</SelectItem>
                                <SelectItem value="overlay">Overlay (ভিডিও উপরে)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="adContent2" className="text-gray-300">Ad Content File (Image/Video)</Label>
                            <Input 
                              id="adContent2" 
                              type="file" 
                              accept="image/*,video/*"
                              className="bg-gray-700 border-gray-600 text-white"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setCreateOrderData(prev => ({...prev, content: file}));
                                }
                              }}
                            />
                            {createOrderData.content && (
                              <p className="text-sm text-gray-400 mt-1">
                                Selected: {createOrderData.content.name}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="targetUrl2" className="text-gray-300">Target URL</Label>
                            <Input 
                              id="targetUrl2" 
                              placeholder="Enter target URL" 
                              className="bg-gray-700 border-gray-600 text-white"
                              value={createOrderData.targetUrl}
                              onChange={(e) => setCreateOrderData(prev => ({...prev, targetUrl: e.target.value}))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="budget2" className="text-gray-300">Budget (USD)</Label>
                            <Input 
                              id="budget2" 
                              type="number" 
                              placeholder="Enter budget" 
                              className="bg-gray-700 border-gray-600 text-white"
                              value={createOrderData.budget}
                              onChange={(e) => setCreateOrderData(prev => ({...prev, budget: parseFloat(e.target.value) || 0}))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cpm2" className="text-gray-300">CPM (Cost per 1000 Impressions)</Label>
                            <Input 
                              id="cpm2" 
                              type="number" 
                              placeholder="Enter CPM" 
                              className="bg-gray-700 border-gray-600 text-white"
                              value={createOrderData.cpm}
                              onChange={(e) => setCreateOrderData(prev => ({...prev, cpm: parseFloat(e.target.value) || 0}))}
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancel</Button>
                            <Button 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={handleCreateCampaign}
                            >
                              Create Campaign
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {stats?.campaigns?.length ? (
                      <div className="space-y-6">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-gray-700">
                                <TableHead className="text-gray-400">Campaign</TableHead>
                                <TableHead className="text-gray-400">Type</TableHead>
                                <TableHead className="text-gray-400">Status</TableHead>
                                <TableHead className="text-gray-400">Start Date</TableHead>
                                <TableHead className="text-gray-400">End Date</TableHead>
                                <TableHead className="text-gray-400">Budget</TableHead>
                                <TableHead className="text-gray-400">Spent</TableHead>
                                <TableHead className="text-gray-400">Impressions</TableHead>
                                <TableHead className="text-gray-400">Target</TableHead>
                                <TableHead className="text-gray-400">Remaining</TableHead>
                                <TableHead className="text-gray-400">CPM</TableHead>
                                <TableHead className="text-gray-400">Revenue/View</TableHead>
                                <TableHead className="text-gray-400">Company %</TableHead>
                                <TableHead className="text-gray-400">CTR</TableHead>
                                <TableHead className="text-gray-400">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stats.campaigns
                                .map(campaign => ({
                                  ...campaign,
                                  status: campaign.impressions >= campaign.targetImpressions ? 'completed' : campaign.status
                                }))
                                .filter((campaign) => {
                                  if (statusFilter === "all") {
                                    return true;
                                  }
                                  if (statusFilter === "active") {
                                    return campaign.impressions < campaign.targetImpressions && campaign.status === "active";
                                  }
                                  if (statusFilter === "completed") {
                                    return campaign.impressions >= campaign.targetImpressions;
                                  }
                                  return true;
                                })
                                .filter((campaign) => {
                                  if (!searchId) {
                                    return true;
                                  }
                                  return campaign.id.toLowerCase().includes(searchId.toLowerCase());
                                })
                                .map((campaign) => {
                                const progress = (campaign.impressions / (campaign.targetImpressions || 1)) * 100;
                                return (
                                  <TableRow key={campaign.id} className="border-gray-700">
                                    <TableCell className="font-medium text-white">{campaign.title}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                                        {campaign.type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={campaign.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-800' : 'bg-gray-600/20 text-gray-400 border-gray-800'}>
                                        {campaign.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-400">{new Date(campaign.startDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-gray-400">{new Date(campaign.endDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-gray-400">${campaign.budget}</TableCell>
                                    <TableCell className="text-gray-400">${campaign.spent}</TableCell>
                                    <TableCell className="text-gray-400">
                                      <div className="flex flex-col space-y-1">
                                        <span>{campaign.impressions}</span>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                          <div 
                                            className="bg-red-600 h-2 rounded-full" 
                                            style={{ width: `${Math.min(100, progress)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400">
                                      {(campaign.targetImpressions || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-gray-400">
                                      {(campaign.remainingImpressions || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-gray-400">
                                      ${(campaign.cpm || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-gray-400">
                                      ${(campaign.revenuePerView || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-gray-400">{campaign.companyPercentage || 30}%</TableCell>
                                    <TableCell className="text-gray-400">{campaign.ctr}%</TableCell>
                                    <TableCell>
                                      <div className="flex space-x-2">
                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-gray-700">
                                          <ExternalLink className="h-4 w-4 text-gray-400" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-400">
                        <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No Campaigns Found</h3>
                        <p>Create your first advertising campaign to get started</p>
                        <Button className="bg-red-600 hover:bg-red-700 text-white mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Campaign
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Analytics & Insights</CardTitle>
                    <p className="text-gray-400">Detailed performance analytics for your campaigns</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-16 text-gray-400">
                      <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
                      <p>Detailed analytics and reporting tools coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}