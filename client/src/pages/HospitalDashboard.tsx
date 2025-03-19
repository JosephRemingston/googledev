import React, { useEffect } from "react";
import { useLocation } from "wouter";
import HospitalSidebar from "@/components/HospitalSidebar";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

const HospitalDashboard = () => {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect if not a hospital user
    if (user && !user.isHospital) {
      navigate("/");
    } else if (!user) {
      navigate("/hospital/login");
    }
  }, [user, navigate]);

  // Fetch bed data
  const { data: beds = [], isLoading: isLoadingBeds } = useQuery({
    queryKey: ["/api/hospital/beds"],
    enabled: !!user?.isHospital,
  });

  // Fetch bookings data
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ["/api/hospital/bookings"],
    enabled: !!user?.isHospital,
  });

  // Calculate dashboard stats
  const totalBeds = beds.reduce((sum: number, bed: any) => sum + bed.totalBeds, 0);
  const availableBeds = beds.reduce((sum: number, bed: any) => sum + bed.availableBeds, 0);
  const pendingBookings = bookings.filter((booking: any) => booking.status === "pending").length;

  if (!user || !user.isHospital) {
    return null; // Don't render anything if not authenticated or not a hospital
  }

  return (
    <div className="flex flex-col lg:flex-row lg:space-x-8 min-h-screen bg-gray-50">
      <HospitalSidebar activePath="/hospital/dashboard" />
      
      <div className="w-full lg:w-3/4 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back, {user.name}</p>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-primary-50 border border-primary-200">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-500">Total Beds</h4>
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoadingBeds ? "..." : totalBeds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border border-green-200">
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
                  <h4 className="text-sm font-medium text-gray-500">Available Beds</h4>
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoadingBeds ? "..." : availableBeds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50 border border-yellow-200">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-500">Pending Bookings</h4>
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoadingBookings ? "..." : pendingBookings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Bookings */}
        <Card className="mb-8">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Booking Requests</h3>
            <button
              onClick={() => navigate("/hospital/dashboard/bookings")}
              className="text-primary hover:text-primary-700 text-sm font-medium"
            >
              View all
            </button>
          </div>
          
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
              <div className="p-6 text-center text-gray-500">No bookings yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Patient
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Bed Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.slice(0, 5).map((booking: any) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                              <div className="text-sm font-medium text-gray-900">
                                {booking.patientName}
                              </div>
                              <div className="text-sm text-gray-500">ID: #{booking.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Bed Type #{booking.bedTypeId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(booking.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : booking.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HospitalDashboard;
