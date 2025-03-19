import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Navigation } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface HospitalListingProps {
  hospital: any;
  bedTypeFilter: string;
  onBookBed: () => void;
}

const HospitalListing: React.FC<HospitalListingProps> = ({
  hospital,
  bedTypeFilter,
  onBookBed,
}) => {
  const { toast } = useToast();

  // Fetch hospital beds
  const { data: beds = [], isLoading } = useQuery({
    queryKey: [`/api/hospitals/${hospital.id}/beds`],
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error loading beds",
        description: error.message || "Could not load hospital beds",
      });
    },
  });

  // Filter beds based on bed type if specified
  const filteredBeds = bedTypeFilter === "all"
    ? beds
    : beds.filter((bed: any) => bed.bedTypeId.toString() === bedTypeFilter);

  const handleDirections = () => {
    const address = `${hospital.address}, ${hospital.city}, ${hospital.state} ${hospital.zipCode}`;
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, "_blank");
  };

  const handleCall = () => {
    window.open(`tel:${hospital.phone}`, "_blank");
  };

  if (isLoading) {
    return (
      <Card className="mb-6 p-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </Card>
    );
  }

  // Skip rendering if no matching beds and filtering
  if (bedTypeFilter !== "all" && filteredBeds.length === 0) {
    return null;
  }
  
  // Check if any beds are available
  const hasAvailableBeds = filteredBeds.some((bed: any) => bed.availableBeds > 0);

  return (
    <Card className="mb-6 overflow-hidden shadow-md">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-semibold text-primary-900">{hospital.name}</h3>
            <p className="text-gray-600 mt-1">
              <MapPin className="h-4 w-4 inline mr-2 text-primary-600" />
              {hospital.address}, {hospital.city}, {hospital.state} {hospital.zipCode}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleDirections}
              className="text-primary hover:text-primary-700 flex items-center"
            >
              <Navigation className="h-4 w-4 mr-1" /> Directions
            </button>
            <button
              onClick={handleCall}
              className="text-primary hover:text-primary-700 flex items-center"
            >
              <Phone className="h-4 w-4 mr-1" /> Contact
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-200 my-6"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBeds.map((bed: any) => (
            <div
              key={bed.id}
              className={`rounded-md p-4 border ${
                bed.availableBeds > 0
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-800">{bed.bedTypeName} Beds</h4>
                {bed.availableBeds > 0 ? (
                  <Badge variant="success">Available</Badge>
                ) : (
                  <Badge variant="danger">Full</Badge>
                )}
              </div>
              <div className="flex items-center">
                <span
                  className={`text-2xl font-bold ${
                    bed.availableBeds > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {bed.availableBeds}
                </span>
                <span className="text-gray-600 ml-2">
                  of {bed.totalBeds} available
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button
            onClick={onBookBed}
            className="bg-primary hover:bg-primary-700 text-white"
            disabled={!hasAvailableBeds}
          >
            {hasAvailableBeds ? "Book a Bed" : "No Beds Available"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default HospitalListing;
