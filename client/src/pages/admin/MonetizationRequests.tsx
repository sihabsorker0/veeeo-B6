
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

export default function MonetizationRequests() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<MonetizationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: requests, isLoading } = useQuery<MonetizationRequest[]>({
    queryKey: ["/api/admin/monetization/requests"],
  });

  const processRequestMutation = useMutation({
    mutationFn: ({ userId, status, notes }: { userId: string; status: string; notes: string }) =>
      apiRequest(`/api/admin/monetization/requests/${userId}`, {
        method: "PATCH",
        body: { status, adminNotes: notes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/monetization/requests"] });
      setSelectedRequest(null);
      setAdminNotes("");
      toast({ title: "Request processed successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to process request", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const filteredRequests = requests?.filter(request => {
    if (filterStatus === "all") return true;
    return request.monetizationStatus === filterStatus;
  }) || [];

  const handleProcessRequest = (status: 'approved' | 'rejected') => {
    if (selectedRequest) {
      processRequestMutation.mutate({
        userId: selectedRequest._id,
        status,
        notes: adminNotes,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Monetization Requests</h1>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Monetization Requests</h1>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            size="sm"
          >
            All ({requests?.length || 0})
          </Button>
          <Button
            variant={filterStatus === "pending" ? "default" : "outline"}
            onClick={() => setFilterStatus("pending")}
            size="sm"
          >
            Pending ({requests?.filter(r => r.monetizationStatus === 'pending').length || 0})
          </Button>
          <Button
            variant={filterStatus === "approved" ? "default" : "outline"}
            onClick={() => setFilterStatus("approved")}
            size="sm"
          >
            Approved ({requests?.filter(r => r.monetizationStatus === 'approved').length || 0})
          </Button>
          <Button
            variant={filterStatus === "rejected" ? "default" : "outline"}
            onClick={() => setFilterStatus("rejected")}
            size="sm"
          >
            Rejected ({requests?.filter(r => r.monetizationStatus === 'rejected').length || 0})
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No requests found</h3>
              <p className="text-gray-500">
                {filterStatus === "all" 
                  ? "No monetization requests have been submitted yet."
                  : `No ${filterStatus} requests found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.monetizationStatus)}
                      {getStatusBadge(request.monetizationStatus)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{request.username}</span>
                        <span className="text-sm text-gray-500">({request.email})</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
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
                          <MessageSquare className="h-4 w-4" />
                          <span>Notes: {request.monetizationAdminNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {request.monetizationStatus === 'pending' && (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => setSelectedRequest(request)}
                            >
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Monetization Request</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-2">
                                  User: <strong>{request.username}</strong> ({request.email})
                                </p>
                                <p className="text-sm text-gray-600">
                                  Requested on: {new Date(request.monetizationRequestedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Admin Notes (Optional)</label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add any notes about this approval..."
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <DialogTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogTrigger>
                                <Button
                                  onClick={() => handleProcessRequest('approved')}
                                  disabled={processRequestMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {processRequestMutation.isPending ? "Processing..." : "Approve Request"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedRequest(request)}
                            >
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Monetization Request</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-2">
                                  User: <strong>{request.username}</strong> ({request.email})
                                </p>
                                <p className="text-sm text-gray-600">
                                  Requested on: {new Date(request.monetizationRequestedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Reason for Rejection</label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Please provide a reason for rejection..."
                                  className="mt-1"
                                  required
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <DialogTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogTrigger>
                                <Button
                                  onClick={() => handleProcessRequest('rejected')}
                                  disabled={processRequestMutation.isPending || !adminNotes.trim()}
                                  variant="destructive"
                                >
                                  {processRequestMutation.isPending ? "Processing..." : "Reject Request"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}

                    {request.monetizationStatus !== 'pending' && (
                      <Button size="sm" variant="outline" disabled>
                        {request.monetizationStatus === 'approved' ? 'Approved' : 'Rejected'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
