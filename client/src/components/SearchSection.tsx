import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Crosshair, Search } from "lucide-react";

interface SearchSectionProps {
  onSearch: (location: string, bedTypeId: string) => void;
  bedTypes: any[];
}

const SearchSection: React.FC<SearchSectionProps> = ({ onSearch, bedTypes }) => {
  const [location, setLocation] = useState("");
  const [bedTypeId, setBedTypeId] = useState("all");

  const handleSearch = () => {
    onSearch(location, bedTypeId);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, we would reverse geocode to get city/state
          // For this demo, we'll just use a placeholder
          setLocation("Current Location");
          handleSearch();
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enter it manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8 text-center">
          Find Available Hospital Beds
        </h1>
        
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                <div className="flex-grow">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="location"
                      type="text"
                      placeholder="Enter city or zip code"
                      className="pl-10"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary hover:text-primary-700"
                      title="Use my current location"
                      onClick={handleUseCurrentLocation}
                    >
                      <Crosshair className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="sm:w-1/3">
                  <label htmlFor="bed-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Bed Type
                  </label>
                  <Select value={bedTypeId} onValueChange={setBedTypeId}>
                    <SelectTrigger id="bed-type">
                      <SelectValue placeholder="Select bed type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {bedTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleSearch}
                  className="bg-primary hover:bg-primary-700 text-white px-6 py-2 h-auto"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search for Beds
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SearchSection;
