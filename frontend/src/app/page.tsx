"use client";

import React, { useState, useEffect } from "react";
import { LocationSearch } from "@/components/location/LocationSearch";
import { GPSLocationDetector } from "@/components/location/GPSLocationDetector";
import { LocationCard } from "@/components/location/LocationCard";
import { TourGenerator } from "@/components/tour/TourGenerator";
import { TourList } from "@/components/tour/TourList";
import { AuthButton } from "@/components/auth/AuthButton";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { LocationResponse } from "@/lib/types";
import { api } from "@/lib/api";

export default function HomePage() {
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null);
  const [showTourGenerator, setShowTourGenerator] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [tourRefreshTrigger, setTourRefreshTrigger] = useState(0);
  const { user, loading } = useAuthContext();

  const handleLocationSelect = (location: LocationResponse) => {
    setSelectedLocation(location);
    setShowTourGenerator(false); // Reset tour generator when new location is selected
  };

  const handleGenerateTour = () => {
    if (!user) {
      alert('Please sign in to generate AI tours!');
      return;
    }
    setShowTourGenerator(true);
  };

  const handleTourGenerated = (tourId: string) => {
    alert(`Tour generated successfully! Tour ID: ${tourId}`);
    setShowTourGenerator(false);
    setTourRefreshTrigger(prev => prev + 1); // Trigger tour list refresh
  };

  // Check backend connectivity on load
  useEffect(() => {
    const checkBackend = async () => {
      try {
        console.log('Checking backend connectivity...');
        await api.healthCheck();
        console.log('Backend connected successfully');
        setBackendStatus('connected');
      } catch (error) {
        console.error('Backend connection failed:', error);
        setBackendStatus('error');
      }
    };
    
    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div> {/* Spacer */}
            <AuthButton />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Walkumentary
          </h1>
          <p className="text-xl text-gray-600">
            Discover amazing places around you with AI-powered tours
          </p>
          
          {/* Backend Status */}
          <div className="mt-4">
            {backendStatus === 'checking' && (
              <p className="text-sm text-blue-600">🔄 Checking backend connection...</p>
            )}
            {backendStatus === 'connected' && (
              <p className="text-sm text-green-600">✅ Backend connected</p>
            )}
            {backendStatus === 'error' && (
              <p className="text-sm text-red-600">❌ Backend not reachable - Please start the backend server</p>
            )}
          </div>
          
          {user && (
            <p className="text-sm text-green-600 mt-2">
              Welcome, {user.email}! You can now generate AI tours.
            </p>
          )}
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
                onGenerateTour={handleGenerateTour}
                onShowOnMap={() => {
                  alert(`Opening ${selectedLocation.name} on map! 🗺️`);
                }}
                onTakePhoto={() => {
                  alert(`Camera feature for ${selectedLocation.name}! 📸`);
                }}
              />
            </div>
          )}

          {/* Tour Generator */}
          {selectedLocation && showTourGenerator && user && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">🎧 Generate AI Tour</h2>
              <TourGenerator
                location={selectedLocation}
                onTourGenerated={handleTourGenerated}
                onClose={() => setShowTourGenerator(false)}
              />
            </div>
          )}

          {/* Tour List - Show user's tours */}
          {user && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">📚 Your Tours</h2>
              <TourList refreshTrigger={tourRefreshTrigger} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}