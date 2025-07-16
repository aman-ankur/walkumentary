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
        {/* Brand Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <img 
              src="/walkumentary_icon_new.png" 
              alt="Walkumentary"
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-xl border-4 border-white object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-orange-200/50 mb-8 shadow-sm">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-orange-700 font-medium text-sm tracking-wide">BEGIN YOUR JOURNEY</span>
        </div>

        {/* Heading */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Where shall we explore?
          </h1>
        </div>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Discover the hidden stories and timeless charm of places around the world
        </p>

        {/* Search box */}
        <div className="max-w-2xl mx-auto w-full mb-6">
          <LocationSearch 
            onLocationSelect={onLocationSelect} 
            placeholder="Search for a destination, landmark, or address..." 
            className="mb-0" 
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8 justify-center">
          <div className="flex-1 max-w-[120px] h-px bg-gradient-to-r from-transparent to-gray-300"></div>
          <span className="text-gray-500 font-medium text-sm px-3">OR</span>
          <div className="flex-1 max-w-[120px] h-px bg-gradient-to-l from-transparent to-gray-300"></div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 max-w-2xl mx-auto">
          <div className="flex-1">
            <GPSLocationDetector 
              onLocationSelect={onLocationSelect} 
              autoStart={false}
              compact={true}
              className="w-full"
            />
          </div>

          <Button 
            variant="outline" 
            className="flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200 font-medium text-gray-700 hover:text-orange-700 shadow-sm hover:shadow-md h-auto min-h-[48px]"
          >
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