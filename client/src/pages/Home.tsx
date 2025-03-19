import React, { useState } from "react";
import SearchSection from "@/components/SearchSection";
import HospitalListing from "@/components/HospitalListing";
import BookingModal from "@/components/BookingModal";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

const Home = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useState({
    location: "",
    bedTypeId: "all",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Fetch approved hospitals
  const { data: hospitals = [], isLoading: isLoadingHospitals } = useQuery({
    queryKey: ["/api/hospitals"],
    enabled: isSearching, // Only fetch when user searches
  });

  // Fetch bed types
  const { data: bedTypes = [] } = useQuery({
    queryKey: ["/api/bedtypes"],
  });

  const handleSearch = (location: string, bedTypeId: string) => {
    setSearchParams({ location, bedTypeId });
    setIsSearching(true);
  };

  const handleBookBed = (hospital: any) => {
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = "/login";
      return;
    }
    
    setSelectedHospital(hospital);
    setIsBookingModalOpen(true);
  };

  // Filter hospitals based on search criteria
  const filteredHospitals = hospitals.filter((hospital: any) => {
    const locationMatch = !searchParams.location || 
      hospital.city.toLowerCase().includes(searchParams.location.toLowerCase()) ||
      hospital.state.toLowerCase().includes(searchParams.location.toLowerCase()) ||
      hospital.zipCode.includes(searchParams.location);
    
    return locationMatch;
  });

  return (
    <div className="py-8">
      <SearchSection onSearch={handleSearch} bedTypes={bedTypes} />
      
      {isSearching && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {isLoadingHospitals
              ? "Searching hospitals..."
              : filteredHospitals.length === 0
              ? "No hospitals found matching your criteria"
              : `Hospitals near ${searchParams.location || "you"}`}
          </h2>
          
          {isLoadingHospitals ? (
            <div className="flex justify-center py-8">
              <svg
                className="animate-spin -ml-1 mr-3 h-8 w-8 text-primary"
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
          ) : (
            filteredHospitals.map((hospital: any) => (
              <HospitalListing
                key={hospital.id}
                hospital={hospital}
                bedTypeFilter={searchParams.bedTypeId}
                onBookBed={() => handleBookBed(hospital)}
              />
            ))
          )}
        </div>
      )}
      
      {/* Booking Modal */}
      {selectedHospital && (
        <BookingModal
          hospital={selectedHospital}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          bedTypes={bedTypes}
          selectedBedTypeId={searchParams.bedTypeId !== "all" ? parseInt(searchParams.bedTypeId) : undefined}
        />
      )}
    </div>
  );
};

export default Home;
