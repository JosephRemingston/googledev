import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { XCircle, AlertCircle } from "lucide-react";

const UserBookings = () => {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate("/login");
    } else if (user.isHospital) {
      navigate("/hospital/dashboard");
    }
  }, [user, navigate]);

  // Fetch user's bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["/api/user/bookings"],
    enabled: !!user && !user.isHospital,
  });

  // Cancel booking mutation
  const { mutate: cancelBooking, isPending } = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiRequest(
        "PATCH",
        `/api/user/bookings/${bookingId}/cancel`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking canceled",
        description: "Your booking has been successfully canceled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookings"] });
      setCancelDialogOpen(false);
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error canceling booking",
        description: error.message || "Please try again later",
      });
    },
  });

  const handleCancelBooking = (booking: any) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const confirmCancelBooking = () => {
    if (selectedBooking) {
      cancelBooking(selectedBooking.id);
    }
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

  if (!user || user.isHospital) {
    return null; // Don't render if not logged in or is a hospital
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">My Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-4">
                You haven't made any bed bookings yet.
              </p>
              <Button
                onClick={() => navigate("/")}
                className="bg-primary hover:bg-primary-700 text-white"
              >
                Find Hospital Beds
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Bed Type</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.hospitalName}
                      </TableCell>
                      <TableCell>{booking.bedTypeName}</TableCell>
                      <TableCell>{booking.patientName}</TableCell>
                      <TableCell>
                        {format(new Date(booking.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        {booking.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleCancelBooking(booking)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Booking Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-500">Hospital</p>
                  <p>{selectedBooking.hospitalName}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Bed Type</p>
                  <p>{selectedBooking.bedTypeName}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Patient</p>
                  <p>{selectedBooking.patientName}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Booking Date</p>
                  <p>{format(new Date(selectedBooking.createdAt), "MMM dd, yyyy")}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isPending}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelBooking}
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
                  Canceling...
                </div>
              ) : (
                "Cancel Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserBookings;
