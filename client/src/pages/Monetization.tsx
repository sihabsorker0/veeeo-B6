
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContextFixed";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Order {
  _id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  user: {
    username: string;
  };
}

interface WithdrawRequest {
  _id: string;
  amount: number;
  method: 'paypal' | 'bank' | 'crypto';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  processedAt?: string;
}

interface MonetizationStats {
  totalEarnings: number;
  pendingWithdrawals: number;
  availableBalance: number;
  withdrawalHistory: WithdrawRequest[];
  orders: Order[];
}

export default function Monetization() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<string>("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankDetails, setBankDetails] = useState({ bankName: "", accountNumber: "", routingNumber: "" });
  const [cryptoDetails, setCryptoDetails] = useState({ type: "", address: "" });

  // Check monetization approval status first
  const { data: monetizationStatus } = useQuery({
    queryKey: ["/api/monetization/status"],
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery<MonetizationStats>({
    queryKey: ["/api/monetization/stats"],
    enabled: isAuthenticated && monetizationStatus?.hasAccess,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["/api/monetization/payment-methods"],
    enabled: isAuthenticated && monetizationStatus?.hasAccess,
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: { amount: number; method: string }) =>
      apiRequest("/api/monetization/withdraw", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monetization/stats"] });
    },
  });

  const savePaymentMethodMutation = useMutation({
    mutationFn: (data: { type: string; details: any }) =>
      apiRequest("/api/monetization/payment-methods", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monetization/payment-methods"] });
    },
  });

  const requestMonetizationMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/monetization/request", {
        method: "POST",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/monetization/status"] });
      toast({
        title: "Request Submitted!",
        description: data.message || "Your monetization request has been submitted for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.response?.data?.message || "Failed to submit monetization request",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Monetization</h1>
        <p>Sign in to access monetization features</p>
      </div>
    );
  }

  // Handle monetization approval status
  if (monetizationStatus && !monetizationStatus.hasAccess) {
    if (monetizationStatus.monetizationStatus === 'not_requested' || !monetizationStatus.monetizationStatus) {
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Monetization Access</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <DollarSign className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Request Monetization Access</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  To access monetization features and analytics, you need to request approval from the admin.
                </p>
                <Button 
                  onClick={() => requestMonetizationMutation.mutate()}
                  disabled={requestMonetizationMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {requestMonetizationMutation.isPending ? "Requesting..." : "Request Monetization Access"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (monetizationStatus.monetizationStatus === 'pending') {
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Monetization Request Pending</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Request Under Review</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Your monetization request is currently being reviewed by the admin. 
                  You will be notified once it's approved.
                </p>
                <p className="text-sm text-gray-500">
                  Requested on: {new Date(monetizationStatus.monetizationRequestedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (monetizationStatus.monetizationStatus === 'rejected') {
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Monetization Request Rejected</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Request Not Approved</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Your monetization request was not approved. Please contact the admin for more information.
                </p>
                <Button 
                  onClick={() => requestMonetizationMutation.mutate()}
                  disabled={requestMonetizationMutation.isPending}
                  variant="outline"
                >
                  {requestMonetizationMutation.isPending ? "Requesting..." : "Request Again"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount && withdrawMethod) {
      withdrawMutation.mutate({ amount, method: withdrawMethod });
    }
  };

  const handleOrderApproval = async (orderId: string, status: 'approved' | 'rejected') => {
    try {
      await apiRequest(`/api/monetization/orders/${orderId}`, {
        method: 'PATCH',
        body: { status }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/monetization/stats"] });
    } catch (error) {
      console.error('Failed to process order:', error);
    }
  };

  const handlePaypalConnect = () => {
    if (paypalEmail.trim()) {
      savePaymentMethodMutation.mutate({
        type: 'paypal',
        details: { email: paypalEmail.trim() }
      }, {
        onSuccess: () => {
          setPaypalEmail("");
          // Force refresh of payment methods data
          queryClient.invalidateQueries({ queryKey: ["/api/monetization/payment-methods"] });
          // Small delay to ensure backend has processed the update
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["/api/monetization/payment-methods"] });
          }, 100);
        },
        onError: (error) => {
          console.error('Failed to save PayPal:', error);
        }
      });
    }
  };

  const handleBankConnect = () => {
    if (bankDetails.bankName.trim() && bankDetails.accountNumber.trim() && bankDetails.routingNumber.trim()) {
      savePaymentMethodMutation.mutate({
        type: 'bank',
        details: {
          bankName: bankDetails.bankName.trim(),
          accountNumber: bankDetails.accountNumber.trim(),
          routingNumber: bankDetails.routingNumber.trim()
        }
      }, {
        onSuccess: () => {
          setBankDetails({ bankName: "", accountNumber: "", routingNumber: "" });
          // Force refresh of payment methods data
          queryClient.invalidateQueries({ queryKey: ["/api/monetization/payment-methods"] });
          // Small delay to ensure backend has processed the update
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["/api/monetization/payment-methods"] });
          }, 100);
        },
        onError: (error) => {
          console.error('Failed to save bank details:', error);
        }
      });
    }
  };

  const handleCryptoConnect = () => {
    if (cryptoDetails.type && cryptoDetails.address.trim()) {
      savePaymentMethodMutation.mutate({
        type: 'crypto',
        details: {
          type: cryptoDetails.type,
          address: cryptoDetails.address.trim()
        }
      }, {
        onSuccess: () => {
          setCryptoDetails({ type: "", address: "" });
          // Force refresh of payment methods data
          queryClient.invalidateQueries({ queryKey: ["/api/monetization/payment-methods"] });
          // Small delay to ensure backend has processed the update
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["/api/monetization/payment-methods"] });
          }, 100);
        },
        onError: (error) => {
          console.error('Failed to save crypto details:', error);
        }
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Monetization Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalEarnings?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.pendingWithdrawals?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.availableBalance?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="withdraw" className="space-y-6">
        <TabsList>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="withdraw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleWithdraw} className="w-full">
                Request Withdrawal
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.withdrawalHistory?.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      {request.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                      {request.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {request.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                      <div>
                        <p className="font-medium">${request.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{new Date(request.requestedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">{request.method}</span>
                      <span className={`capitalize px-2 py-1 rounded text-sm ${
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Monetization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Methods</Label>
                <div className="grid gap-4">
                  <div className="flex items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">PayPal</h3>
                      <p className="text-sm text-gray-500">
                        {paymentMethods?.paymentMethods?.paypal ? 
                          `Connected: ${paymentMethods.paymentMethods.paypal.email}` : 
                          "Connect your PayPal account"
                        }
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          {paymentMethods?.paymentMethods?.paypal ? 'Update' : 'Connect'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Connect PayPal Account</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="paypal-email">PayPal Email</Label>
                            <Input
                              id="paypal-email"
                              type="email"
                              value={paypalEmail}
                              onChange={(e) => setPaypalEmail(e.target.value)}
                              placeholder="Enter your PayPal email"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <DialogTrigger asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogTrigger>
                            <Button onClick={handlePaypalConnect} disabled={!paypalEmail.trim() || savePaymentMethodMutation.isPending}>
                              {savePaymentMethodMutation.isPending ? "Connecting..." : "Connect PayPal"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">Bank Account</h3>
                      <p className="text-sm text-gray-500">
                        {paymentMethods?.paymentMethods?.bank ? 
                          `Connected: ${paymentMethods.paymentMethods.bank.bankName}` : 
                          "Add your bank account details"
                        }
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          {paymentMethods?.paymentMethods?.bank ? 'Update' : 'Add'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Bank Account</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="bank-name">Bank Name</Label>
                            <Input
                              id="bank-name"
                              value={bankDetails.bankName}
                              onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                              placeholder="Enter bank name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="account-number">Account Number</Label>
                            <Input
                              id="account-number"
                              value={bankDetails.accountNumber}
                              onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                              placeholder="Enter account number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="routing-number">Routing Number</Label>
                            <Input
                              id="routing-number"
                              value={bankDetails.routingNumber}
                              onChange={(e) => setBankDetails(prev => ({ ...prev, routingNumber: e.target.value }))}
                              placeholder="Enter routing number"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <DialogTrigger asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogTrigger>
                            <Button onClick={handleBankConnect} disabled={!bankDetails.bankName.trim() || !bankDetails.accountNumber.trim() || !bankDetails.routingNumber.trim() || savePaymentMethodMutation.isPending}>
                              {savePaymentMethodMutation.isPending ? "Adding..." : "Add Account"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">Cryptocurrency</h3>
                      <p className="text-sm text-gray-500">
                        {paymentMethods?.paymentMethods?.crypto ? 
                          `Connected: ${paymentMethods.paymentMethods.crypto.type.toUpperCase()}` : 
                          "Set up crypto payments"
                        }
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          {paymentMethods?.paymentMethods?.crypto ? 'Update' : 'Setup'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Setup Cryptocurrency</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="crypto-type">Cryptocurrency Type</Label>
                            <Select value={cryptoDetails.type} onValueChange={(value) => setCryptoDetails(prev => ({ ...prev, type: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select crypto type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                                <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                                <SelectItem value="usdt">Tether (USDT)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="crypto-address">Wallet Address</Label>
                            <Input
                              id="crypto-address"
                              value={cryptoDetails.address}
                              onChange={(e) => setCryptoDetails(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Enter your wallet address"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <DialogTrigger asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogTrigger>
                            <Button onClick={handleCryptoConnect} disabled={!cryptoDetails.type || !cryptoDetails.address.trim() || savePaymentMethodMutation.isPending}>
                              {savePaymentMethodMutation.isPending ? "Setting up..." : "Setup Crypto"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order Monetization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* {stats && stats.orders && stats.orders.map((order) => ( */}
                {[].map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      {order.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                      {order.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {order.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                      <div>
                        <p className="font-medium">${order.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{order.user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button 
                        onClick={() => handleOrderApproval(order._id, 'approved')}
                        variant="outline"
                        className="bg-green-100"
                      >
                        Approve
                      </Button>
                      <Button 
                        onClick={() => handleOrderApproval(order._id, 'rejected')}
                        variant="outline"
                        className="bg-red-100"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
