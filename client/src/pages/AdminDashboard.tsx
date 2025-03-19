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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, Key, Server } from "lucide-react";
import ApiKeyModal from "@/components/ApiKeyModal";

const AdminDashboard = () => {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  useEffect(() => {
    // Redirect if not admin
    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Define hospital type
  interface Hospital {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    website: string | null;
    latitude: string | null;
    longitude: string | null;
    approved: boolean;
  }
  
  // Fetch pending hospital registrations
  const { data: pendingHospitals = [], isLoading: isLoadingPending } = useQuery<Hospital[]>({
    queryKey: ["/api/admin/hospitals/pending"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch all hospitals
  const { data: allHospitals = [], isLoading: isLoadingAll } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
    enabled: !!user && user.role === "admin",
  });
  
  // Fetch API status
  interface ApiStatus {
    available: boolean;
    hasApiKey: boolean;
    apiUrl: string;
  }
  
  const { data: apiStatus, isLoading: isLoadingApiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/config/api-status"],
    enabled: !!user && user.role === "admin",
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Approve/reject hospital mutation
  const { mutate: updateHospitalApproval, isPending } = useMutation({
    mutationFn: async ({ id, approve }: { id: number; approve: boolean }) => {
      const endpoint = approve
        ? `/api/admin/hospitals/${id}/approve`
        : `/api/admin/hospitals/${id}/reject`;
      const response = await apiRequest("PATCH", endpoint, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: actionType === "approve" ? "Hospital approved" : "Hospital rejected",
        description: actionType === "approve"
          ? "The hospital can now log in and start managing beds"
          : "The hospital registration has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hospitals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      setConfirmDialogOpen(false);
      setSelectedHospital(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Operation failed",
        description: error.message || "Please try again",
      });
    },
  });

  const handleApproveHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setActionType("approve");
    setConfirmDialogOpen(true);
  };

  const handleRejectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setActionType("reject");
    setConfirmDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedHospital || !actionType) return;
    
    updateHospitalApproval({
      id: selectedHospital.id,
      approve: actionType === "approve",
    });
  };

  if (!user || user.role !== "admin") {
    return null; // Don't render if not admin
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-primary-100">Hospital Management System</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                variant="outline"
                className="text-white border-white hover:bg-primary-700"
                onClick={() => navigate("/")}
              >
                Back to Homepage
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-500">Total Hospitals</h4>
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoadingAll ? "..." : allHospitals.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-500 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-500">Pending Approvals</h4>
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoadingPending ? "..." : pendingHospitals.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-500 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-500">Approved Hospitals</h4>
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoadingAll ? "..." : allHospitals.filter((h: any) => h.approved).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="all">All Hospitals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Hospital Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPending ? (
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
                ) : pendingHospitals.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
                    <p className="text-gray-600">
                      All hospital registrations have been processed
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hospital Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingHospitals.map((hospital: any) => (
                          <TableRow key={hospital.id}>
                            <TableCell className="font-medium">
                              {hospital.name}
                            </TableCell>
                            <TableCell>
                              {hospital.city}, {hospital.state}
                            </TableCell>
                            <TableCell>
                              <div>{hospital.email}</div>
                              <div className="text-sm text-gray-500">{hospital.phone}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleApproveHospital(hospital)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-600 text-red-600 hover:bg-red-50"
                                  onClick={() => handleRejectHospital(hospital)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
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
          </TabsContent>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Hospitals</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAll ? (
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
                ) : allHospitals.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
                    <p className="text-gray-600">
                      No hospitals have registered yet
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hospital Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allHospitals.map((hospital: any) => (
                          <TableRow key={hospital.id}>
                            <TableCell className="font-medium">
                              {hospital.name}
                            </TableCell>
                            <TableCell>
                              {hospital.city}, {hospital.state}
                            </TableCell>
                            <TableCell>
                              <div>{hospital.email}</div>
                              <div className="text-sm text-gray-500">{hospital.phone}</div>
                            </TableCell>
                            <TableCell>
                              {hospital.approved ? (
                                <Badge variant="success">Approved</Badge>
                              ) : (
                                <Badge variant="warning">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!hospital.approved ? (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleApproveHospital(hospital)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-600 text-red-600 hover:bg-red-50"
                                  onClick={() => handleRejectHospital(hospital)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Revoke
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
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Hospital" : "Reject Hospital"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Are you sure you want to approve this hospital? They will be able to log in and manage beds."
                : "Are you sure you want to reject this hospital registration?"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedHospital && (
            <div className="py-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Hospital Name</p>
                  <p className="text-gray-900">{selectedHospital.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-gray-900">
                    {selectedHospital.address}, {selectedHospital.city}, {selectedHospital.state} {selectedHospital.zipCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact</p>
                  <p className="text-gray-900">{selectedHospital.email} | {selectedHospital.phone}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
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

      {/* API Key Management */}
      <ApiKeyModal 
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
      />

      {/* API Management Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Hospital API Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-2">API Status</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  {isLoadingApiStatus ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin h-5 w-5 text-primary mr-2"
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
                      Checking API status...
                    </div>
                  ) : !apiStatus ? (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      API connection unavailable
                    </div>
                  ) : !apiStatus.hasApiKey ? (
                    <div className="flex items-center text-yellow-600">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      API key not configured
                    </div>
                  ) : apiStatus.available ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      API connection available
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      API connection failed
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <p>
                    The hospital data API allows the system to fetch real-time data from
                    hospitals in the network. Configure your API settings below.
                  </p>
                </div>

                <Button 
                  className="w-full sm:w-auto" 
                  onClick={() => setApiKeyModalOpen(true)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  {apiStatus?.hasApiKey ? "Update API Key" : "Configure API Key"}
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">API Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-3">
                    <span className="font-medium">API URL:</span>
                    <div className="text-sm mt-1 text-gray-600">
                      {apiStatus?.apiUrl || "Not configured"}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <span className="font-medium">API Key Status:</span>
                    <div className="text-sm mt-1 text-gray-600">
                      {!apiStatus ? (
                        "Unknown"
                      ) : apiStatus.hasApiKey ? (
                        <span className="text-green-600 font-medium">Configured</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">Not configured</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Last Checked:</span>
                    <div className="text-sm mt-1 text-gray-600">
                      {apiStatus ? new Date().toLocaleTimeString() : "Never"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
