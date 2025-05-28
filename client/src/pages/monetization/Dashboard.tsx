import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Clock, CheckCircle, XCircle, User, Calendar, Plus, TrendingUp, CreditCard, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MonetizationOrder {
  _id: string;
  userId: string;
  username: string;
  email: string;
  amount: number;
  type: 'revenue' | 'bonus' | 'commission';
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  adminNotes?: string;
}

interface WithdrawRequest {
  _id: string;
  userId: string;
  username: string;
  email: string;
  amount: number;
  method: 'paypal' | 'bank' | 'crypto';
  accountDetails: {
    paypalEmail?: string;
    bankAccount?: string;
    bankName?: string;
    routingNumber?: string;
    cryptoAddress?: string;
    cryptoType?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  processedAt?: string;
  adminNotes?: string;
  userBalance: number;
}

interface MonetizationRequest {
  _id: string;
  username: string;
  email: string;
  monetizationStatus: 'pending' | 'approved' | 'rejected';
  monetizationRequestedAt: string;
  monetizationApprovedAt?: string;
  monetizationProcessedAt?: string;
  monetizationAdminNotes?: string;
  createdAt: string;
}

interface CreateOrderData {
  userId: string;
  amount: number;
  type: string;
  description: string;
}

export default function MonetizationDashboard() {
  const { toast } = useToast();
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [requestFilter, setRequestFilter] = useState<string>("all");
  const [withdrawalFilter, setWithdrawalFilter] = useState<string>("all");
  const [createOrderData, setCreateOrderData] = useState<CreateOrderData>({
    userId: "",
    amount: 0,
    type: "",
    description: ""
  });

  const { data: orders } = useQuery<MonetizationOrder[]>({
    queryKey: ["/api/admin/monetization/orders"],
  });

  const { data: requests } = useQuery<WithdrawRequest[]>({
    queryKey: ["/api/admin/withdraws"],
  });

  const { data: monetizationRequests } = useQuery<MonetizationRequest[]>({
    queryKey: ["/api/admin/monetization/requests"],
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderData) => 
      apiRequest("/api/admin/monetization/orders", { method: "POST", body: orderData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/monetization/orders"] });
      setIsCreateOrderModalOpen(false);
      setCreateOrderData({ userId: "", amount: 0, type: "", description: "" });
      toast({ title: "Order created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create order", variant: "destructive" });
    }
  });

  const processOrderMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes: string }) => 
      apiRequest(`/api/admin/monetization/orders/${id}/process`, { 
        method: "PATCH", 
        body: { status, adminNotes: notes } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/monetization/orders"] });
      toast({ title: "Order processed successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to process order", variant: "destructive" });
    }
  });

  const processWithdrawMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes: string }) => 
      apiRequest(`/api/admin/withdraws/${id}/process`, { 
        method: "PATCH", 
        body: { status, adminNotes: notes } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdraws"] });
      toast({ title: "Withdrawal request processed successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to process withdrawal request", variant: "destructive" });
    }
  });

  const processMonetizationRequestMutation = useMutation({
    mutationFn: ({ userId, status, notes }: { userId: string; status: string; notes: string }) =>
      apiRequest(`/api/admin/monetization/requests/${userId}`, {
        method: "PATCH",
        body: { status, adminNotes: notes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/monetization/requests"] });
      toast({ title: "Monetization request processed successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to process monetization request", variant: "destructive" });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      completed: "default",
      rejected: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMethodDisplay = (method: string) => {
    const methods = {
      paypal: "PayPal",
      bank: "Bank Transfer",
      crypto: "Cryptocurrency"
    };
    return methods[method as keyof typeof methods] || method;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        {/* Admin Sidebar */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Monetization</h1>
                <p className="text-xs text-gray-400">Admin Panel</p>
              </div>
            </div>

            <nav className="space-y-2">
              <div className="bg-gray-800 rounded-lg p-3 border-l-4 border-red-600">
                <div className="flex items-center gap-3 text-white">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Monetization</span>
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
                <h1 className="text-2xl font-bold text-white">Monetization & Withdrawal Dashboard</h1>
                <p className="text-gray-400 mt-1">Manage user monetization orders and withdrawal requests</p>
              </div>
              <div className="flex gap-3">
                <Dialog open={isCreateOrderModalOpen} onOpenChange={setIsCreateOrderModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create Monetization Order</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="userId" className="text-gray-300">User ID</Label>
                        <Input
                          id="userId"
                          value={createOrderData.userId}
                          onChange={(e) => setCreateOrderData(prev => ({ ...prev, userId: e.target.value }))}
                          placeholder="Enter user ID"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount" className="text-gray-300">Amount ($)</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={createOrderData.amount}
                          onChange={(e) => setCreateOrderData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                          placeholder="Enter amount"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="type" className="text-gray-300">Order Type</Label>
                        <Select value={createOrderData.type} onValueChange={(value) => setCreateOrderData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Select order type" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="revenue">Revenue Share</SelectItem>
                            <SelectItem value="bonus">Bonus Payment</SelectItem>
                            <SelectItem value="commission">Commission</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description" className="text-gray-300">Description</Label>
                        <Textarea
                          id="description"
                          value={createOrderData.description}
                          onChange={(e) => setCreateOrderData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter order description"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsCreateOrderModalOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => createOrderMutation.mutate(createOrderData)}
                          disabled={createOrderMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Create Order
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
            <Tabs defaultValue="monetization" className="space-y-6">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="monetization" className="data-[state=active]:bg-gray-700 text-white">
                  Monetization Orders
                </TabsTrigger>
                <TabsTrigger value="requests" className="data-[state=active]:bg-gray-700 text-white">
                  Monetization Requests
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="data-[state=active]:bg-gray-700 text-white">
                  Withdrawal Requests
                </TabsTrigger>
              </TabsList>

              <TabsContent value="monetization">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Monetization Orders</CardTitle>
                    <p className="text-gray-400">Manage user monetization orders and payments</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orders?.map((order) => (
                        <div key={order._id} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              {getStatusBadge(order.status)}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-white">{order.username}</span>
                                <span className="text-sm text-gray-500">({order.email})</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${order.amount.toFixed(2)}
                                </span>
                                <span className="capitalize">{order.type}</span>
                                <span>{order.description}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {order.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => processOrderMutation.mutate({ id: order._id, status: 'rejected', notes: 'Rejected by admin' })}
                                  className="border-red-600 text-red-400 hover:bg-red-900"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => processOrderMutation.mutate({ id: order._id, status: 'approved', notes: 'Approved by admin' })}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-12 text-gray-400">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No monetization orders found</p>
                          <p>Orders will appear here when created</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requests">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white">Monetization Requests</CardTitle>
                        <p className="text-gray-400">Manage user monetization access requests</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={requestFilter === "all" ? "default" : "outline"}
                          onClick={() => setRequestFilter("all")}
                          size="sm"
                          className="text-white"
                        >
                          All ({monetizationRequests?.length || 0})
                        </Button>
                        <Button
                          variant={requestFilter === "pending" ? "default" : "outline"}
                          onClick={() => setRequestFilter("pending")}
                          size="sm"
                          className="text-white"
                        >
                          Pending ({monetizationRequests?.filter(r => r.monetizationStatus === 'pending').length || 0})
                        </Button>
                        <Button
                          variant={requestFilter === "approved" ? "default" : "outline"}
                          onClick={() => setRequestFilter("approved")}
                          size="sm"
                          className="text-white"
                        >
                          Approved ({monetizationRequests?.filter(r => r.monetizationStatus === 'approved').length || 0})
                        </Button>
                        <Button
                          variant={requestFilter === "rejected" ? "default" : "outline"}
                          onClick={() => setRequestFilter("rejected")}
                          size="sm"
                          className="text-white"
                        >
                          Rejected ({monetizationRequests?.filter(r => r.monetizationStatus === 'rejected').length || 0})
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {monetizationRequests?.filter(request => {
                        if (requestFilter === "all") return true;
                        return request.monetizationStatus === requestFilter;
                      })?.map((request) => (
                        <div key={request._id} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(request.monetizationStatus)}
                              {getStatusBadge(request.monetizationStatus)}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-white">{request.username}</span>
                                <span className="text-sm text-gray-500">({request.email})</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Requested: {new Date(request.monetizationRequestedAt).toLocaleDateString()}
                                </span>
                                {request.monetizationProcessedAt && (
                                  <span className="flex items-center gap-1">
                                    Processed: {new Date(request.monetizationProcessedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {request.monetizationAdminNotes && (
                                <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                                  <span>Notes: {request.monetizationAdminNotes}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {request.monetizationStatus === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => processMonetizationRequestMutation.mutate({ 
                                    userId: request._id, 
                                    status: 'rejected', 
                                    notes: 'Rejected by admin' 
                                  })}
                                  className="border-red-600 text-red-400 hover:bg-red-900"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => processMonetizationRequestMutation.mutate({ 
                                    userId: request._id, 
                                    status: 'approved', 
                                    notes: 'Approved by admin' 
                                  })}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            {request.monetizationStatus !== 'pending' && (
                              <span className="text-sm text-gray-400 capitalize">
                                {request.monetizationStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-12 text-gray-400">
                          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">
                            {requestFilter === "all" 
                              ? "No monetization requests found" 
                              : `No ${requestFilter} requests found`
                            }
                          </p>
                          <p>
                            {requestFilter === "all" 
                              ? "Requests will appear here when users submit them"
                              : `No requests with ${requestFilter} status`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="withdrawals">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white">Withdrawal Requests</CardTitle>
                        <p className="text-gray-400">Manage user withdrawal requests and payments</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={withdrawalFilter === "all" ? "default" : "outline"}
                          onClick={() => setWithdrawalFilter("all")}
                          size="sm"
                          className="text-white"
                        >
                          All ({requests?.length || 0})
                        </Button>
                        <Button
                          variant={withdrawalFilter === "pending" ? "default" : "outline"}
                          onClick={() => setWithdrawalFilter("pending")}
                          size="sm"
                          className="text-white"
                        >
                          Pending ({requests?.filter(r => r.status === 'pending').length || 0})
                        </Button>
                        <Button
                          variant={withdrawalFilter === "approved" ? "default" : "outline"}
                          onClick={() => setWithdrawalFilter("approved")}
                          size="sm"
                          className="text-white"
                        >
                          Approved ({requests?.filter(r => r.status === 'approved').length || 0})
                        </Button>
                        <Button
                          variant={withdrawalFilter === "completed" ? "default" : "outline"}
                          onClick={() => setWithdrawalFilter("completed")}
                          size="sm"
                          className="text-white"
                        >
                          Completed ({requests?.filter(r => r.status === 'completed').length || 0})
                        </Button>
                        <Button
                          variant={withdrawalFilter === "rejected" ? "default" : "outline"}
                          onClick={() => setWithdrawalFilter("rejected")}
                          size="sm"
                          className="text-white"
                        >
                          Rejected ({requests?.filter(r => r.status === 'rejected').length || 0})
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {requests?.filter(request => {
                        if (withdrawalFilter === "all") return true;
                        return request.status === withdrawalFilter;
                      })?.map((request) => (
                        <div key={request._id} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(request.status)}
                              {getStatusBadge(request.status)}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-white">{request.username}</span>
                                <span className="text-sm text-gray-500">({request.email})</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${request.amount.toFixed(2)}
                                </span>
                                <span>{getMethodDisplay(request.method)}</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(request.requestedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="bg-gray-800 p-3 rounded text-sm text-gray-300 space-y-2">
                                <div className="font-medium text-white mb-2">User & Account Details:</div>
                                
                                {/* User Balance */}
                                <div className="bg-gray-700 p-2 rounded">
                                  <span className="font-medium text-blue-400">Current Balance:</span> ${request.userBalance.toFixed(2)}
                                </div>
                                
                                {/* Payment Method Details */}
                                <div className="space-y-1">
                                  <div className="font-medium text-green-400">Payment Method: {getMethodDisplay(request.method)}</div>
                                  
                                  {request.method === 'paypal' && (
                                    <div className="ml-2 space-y-1">
                                      <div><span className="text-gray-400">PayPal Email:</span> {request.accountDetails?.paypalEmail || 'Not provided'}</div>
                                    </div>
                                  )}
                                  
                                  {request.method === 'bank' && (
                                    <div className="ml-2 space-y-1">
                                      <div><span className="text-gray-400">Bank Name:</span> {request.accountDetails?.bankName || 'Not provided'}</div>
                                      <div><span className="text-gray-400">Account Number:</span> {request.accountDetails?.bankAccount || 'Not provided'}</div>
                                      <div><span className="text-gray-400">Routing Number:</span> {request.accountDetails?.routingNumber || 'Not provided'}</div>
                                    </div>
                                  )}
                                  
                                  {request.method === 'crypto' && (
                                    <div className="ml-2 space-y-1">
                                      <div><span className="text-gray-400">Crypto Type:</span> {request.accountDetails?.cryptoType || 'Not provided'}</div>
                                      <div><span className="text-gray-400">Wallet Address:</span> 
                                        <span className="font-mono text-xs break-all ml-1">
                                          {request.accountDetails?.cryptoAddress || 'Not provided'}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Request Status & Dates */}
                                <div className="bg-gray-700 p-2 rounded space-y-1">
                                  <div><span className="text-gray-400">Requested:</span> {new Date(request.requestedAt).toLocaleString()}</div>
                                  {request.processedAt && (
                                    <div><span className="text-gray-400">Processed:</span> {new Date(request.processedAt).toLocaleString()}</div>
                                  )}
                                </div>
                                
                                {request.adminNotes && (
                                  <div className="bg-yellow-900/20 p-2 rounded border-l-2 border-yellow-500">
                                    <span className="font-medium text-yellow-400">Admin Notes:</span> 
                                    <div className="mt-1 text-gray-300">{request.adminNotes}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => processWithdrawMutation.mutate({ id: request._id, status: 'rejected', notes: 'Rejected by admin' })}
                                  className="border-red-600 text-red-400 hover:bg-red-900"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => processWithdrawMutation.mutate({ id: request._id, status: 'approved', notes: 'Approved by admin' })}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-12 text-gray-400">
                          <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">
                            {withdrawalFilter === "all" 
                              ? "No withdrawal requests found" 
                              : `No ${withdrawalFilter} withdrawal requests found`
                            }
                          </p>
                          <p>
                            {withdrawalFilter === "all" 
                              ? "Requests will appear here when users submit them"
                              : `No requests with ${withdrawalFilter} status`
                            }
                          </p>
                        </div>
                      )}
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