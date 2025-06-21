"use client";

import React, { useState } from "react";
import { LocationSearch } from "@/components/location/LocationSearch";
import { GPSLocationDetector } from "@/components/location/GPSLocationDetector";
import { LocationCard } from "@/components/location/LocationCard";
import { LocationResponse } from "@/lib/types";

export default function HomePage() {
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null);

  const handleLocationSelect = (location: LocationResponse) => {
    setSelectedLocation(location);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Walkumentary
          </h1>
          <p className="text-xl text-gray-600">
            Discover amazing places around you with AI-powered tours
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Location Search */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Find Locations</h2>
            <LocationSearch 
              onLocationSelect={handleLocationSelect}
              placeholder="Search for museums, landmarks, parks..."
            />
          </div>

          {/* GPS Detection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">GPS Discovery</h2>
            <GPSLocationDetector 
              onLocationSelect={handleLocationSelect}
              autoStart={false}
              showSettings={true}
            />
          </div>

          {/* Selected Location */}
          {selectedLocation && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Selected Location</h2>
              <LocationCard
                location={selectedLocation}
                onGenerateTour={() => {
                  alert(`Generating AI tour for ${selectedLocation.name}! 🎧`);
                }}
                onShowOnMap={() => {
                  alert(`Opening ${selectedLocation.name} on map! 🗺️`);
                }}
                onTakePhoto={() => {
                  alert(`Camera feature for ${selectedLocation.name}! 📸`);
                }}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}