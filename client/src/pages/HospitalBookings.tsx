import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import HospitalSidebar from "@/components/HospitalSidebar";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye } from "lucide-react";

const HospitalBookings = () => {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    // Redirect if not a hospital user
    if (user && !user.isHospital) {
      navigate("/");
    } else if (!user) {
      navigate("/hospital/login");
    }
  }, [user, navigate]);

  // Fetch bookings data
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ["/api/hospital/bookings"],
    enabled: !!user?.isHospital,
    refetchInterval: 10000, // Poll every 10 seconds for new bookings
  });

  // Fetch bed types for showing bed type names
  const { data: bedTypes = [] } = useQuery({
    queryKey: ["/api/bedtypes"],
  });

  // Get bed type name by id
  const getBedTypeName = (id: number) => {
    const bedType = bedTypes.find((type: any) => type.id === id);
    return bedType ? bedType.name : `Bed Type ${id}`;
  };

  // Update booking status mutation
  const { mutate: updateBookingStatus, isPending } = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/hospital/bookings/${id}`,
        { status }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: actionType === "approve" ? "Booking approved" : "Booking rejected",
        description: actionType === "approve"
          ? "The bed has been reserved for this patient"
          : "The booking request has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hospital/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hospital/beds"] });
      setConfirmationOpen(false);
      setSelectedBooking(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update booking",
        description: error.message || "Please try again",
      });
    },
  });

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleApproveRequest = (booking: any) => {
    setSelectedBooking(booking);
    setActionType("approve");
    setConfirmationOpen(true);
  };

  const handleRejectRequest = (booking: any) => {
    setSelectedBooking(booking);
    setActionType("reject");
    setConfirmationOpen(true);
  };

  const confirmAction = () => {
    if (!selectedBooking || !actionType) return;
    
    updateBookingStatus({
      id: selectedBooking.id,
      status: actionType === "approve" ? "approved" : "rejected",
    });
  };

  // Format date with relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      case "canceled":
        return <Badge variant="default">Canceled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!user || !user.isHospital) {
    return null; // Don't render anything if not authenticated or not a hospital
  }

  return (
    <div className="flex flex-col lg:flex-row lg:space-x-8 min-h-screen bg-gray-50">
      <HospitalSidebar activePath="/hospital/dashboard/bookings" />
      
      <div className="w-full lg:w-3/4 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Requests</h1>
          <p className="text-gray-600">Manage patient bed booking requests</p>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {isLoadingBookings ? (
              <div className="flex justify-center py-8">
                <svg
                  className="animate-spin h-8 w-8 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-6 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600">
                  When patients book beds at your hospital, they will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Bed Type</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking: any) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium">{booking.patientName}</div>
                              <div className="text-sm text-gray-500">ID: #{booking.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getBedTypeName(booking.bedTypeId)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(booking.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(booking)}
                              className="h-8 w-8 p-0"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Details</span>
                            </Button>
                            
                            {booking.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApproveRequest(booking)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectRequest(booking)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Booking Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div>{getStatusBadge(selectedBooking.status)}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <div className="text-sm font-medium text-gray-500">Patient Name</div>
                  <div>{selectedBooking.patientName}</div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <div className="text-sm font-medium text-gray-500">Contact Phone</div>
                  <div>{selectedBooking.patientPhone || "Not provided"}</div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <div className="text-sm font-medium text-gray-500">Bed Type</div>
                <div>{getBedTypeName(selectedBooking.bedTypeId)}</div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <div className="text-sm font-medium text-gray-500">Booking Time</div>
                <div>{new Date(selectedBooking.createdAt).toLocaleString()}</div>
              </div>
              
              {selectedBooking.notes && (
                <div className="flex flex-col space-y-1">
                  <div className="text-sm font-medium text-gray-500">Additional Notes</div>
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    {selectedBooking.notes}
                  </div>
                </div>
              )}
              
              {selectedBooking.status === "pending" && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    onClick={() => {
                      setDetailsOpen(false);
                      handleApproveRequest(selectedBooking);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50 flex-1"
                    onClick={() => {
                      setDetailsOpen(false);
                      handleRejectRequest(selectedBooking);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Booking Request" : "Reject Booking Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Are you sure you want to approve this booking? A bed will be reserved for this patient."
                : "Are you sure you want to reject this booking request?"}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmationOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              className={
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
              onClick={confirmAction}
              disabled={isPending}
            >
              {isPending ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </div>
              ) : actionType === "approve" ? (
                "Confirm Approval"
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalBookings;
