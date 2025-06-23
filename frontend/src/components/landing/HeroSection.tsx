"use client";

import { LocationSearch } from "@/components/location/LocationSearch";
import { GPSLocationDetector } from "@/components/location/GPSLocationDetector";
import { Button } from "@/components/ui/button";
import { Navigation, Camera } from "lucide-react";
import React from "react";
import { LocationResponse } from "@/lib/types";
import { PopularDestinations } from "@/components/landing/PopularDestinations";

interface HeroSectionProps {
  onLocationSelect: (loc: LocationResponse) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLocationSelect }) => {
  return (
    <section className="bg-gradient-to-b from-orange-50 to-white py-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-orange-200 mb-8">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-orange-700 font-medium text-sm">BEGIN YOUR JOURNEY</span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Where shall we explore?
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Discover the hidden stories and timeless charm of places around the world
        </p>

        {/* Search box */}
        <div className="max-w-2xl mx-auto w-full">
          <LocationSearch onLocationSelect={onLocationSelect} placeholder="Search for a destination, landmark, or address..." className="mb-4" />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8 justify-center">
          <div className="flex-1 max-w-[120px] h-px bg-gray-200"></div>
          <span className="text-gray-400 font-medium">OR</span>
          <div className="flex-1 max-w-[120px] h-px bg-gray-200"></div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 max-w-2xl mx-auto">
          <GPSLocationDetector onLocationSelect={onLocationSelect} autoStart={false}>
            {(startDetect) => (
              <Button onClick={startDetect} variant="primary" className="flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl">
                <Navigation className="w-5 h-5" />
                Use Current Location
              </Button>
            )}
          </GPSLocationDetector>

          <Button variant="outline" className="flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl">
            <Camera className="w-5 h-5" />
            Identify with Camera
          </Button>
        </div>

        {/* Popular Destinations */}
        <PopularDestinations onSelect={(city) => {
          // just populate search value via onLocationSelect null now
          onLocationSelect({
            id: "popular" + city,
            name: city,
            latitude: 0,
            longitude: 0,
            description: "Popular destination",
          } as any);
        }} />
      </div>
    </section>
  );
}; 