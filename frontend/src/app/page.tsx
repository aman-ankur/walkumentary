"use client";

import React, { useState, useEffect } from "react";
import { LocationSearch } from "@/components/location/LocationSearch";
import { GPSLocationDetector } from "@/components/location/GPSLocationDetector";
import { LocationCard } from "@/components/location/LocationCard";
import { TourGenerator } from "@/components/tour/TourGenerator";
import { TourList } from "@/components/tour/TourList";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { LocationResponse } from "@/lib/types";
import { api } from "@/lib/api";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/landing/HeroSection";

export default function HomePage() {
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null);
  const [showTourGenerator, setShowTourGenerator] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [tourRefreshTrigger, setTourRefreshTrigger] = useState(0);
  const { user, loading } = useAuthContext();
  const router = useRouter();

  const handleLocationSelect = (location: LocationResponse) => {
    setSelectedLocation(location);
    setShowTourGenerator(false); // Reset tour generator when new location is selected
  };

  const handleGenerateTour = async () => {
    if (!user) {
      alert('Please sign in to generate AI tours!');
      return;
    }
    if (!selectedLocation?.id) {
      try {
        const stored = await api.storeExternalLocation(selectedLocation);
        let locId = stored.id;
        router.push(`/customize?location_id=${locId}`);
      } catch (err: any) {
        alert(err.message || 'Failed to create location');
        return;
      }
    }
  };

  const handleTourGenerated = (tourId: string) => {
    alert(`Tour generated successfully! Tour ID: ${tourId}`);
    setShowTourGenerator(false);
    setTourRefreshTrigger(prev => prev + 1); // Trigger tour list refresh
  };

  // Check backend connectivity on load (deferred to avoid search congestion)
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
    
    // Defer health check to prioritize location search
    const healthCheckDelay = setTimeout(() => {
      checkBackend();
    }, 2000); // Wait 2 seconds before health check

    return () => clearTimeout(healthCheckDelay);
  }, []);

  return (
    <div className="min-h-screen bg-warm-50">
      <Header />

      {/* Hero */}
      <HeroSection onLocationSelect={handleLocationSelect} />

      <div className="container mx-auto px-4 py-8">
        {/* Status + greeting */}
        <div className="text-center my-8">
          {backendStatus === 'checking' && (
            <p className="text-sm text-blue-600">🔄 Checking backend connection...</p>
          )}
          {backendStatus === 'connected' && (
            <p className="text-sm text-green-600">✅ Backend connected</p>
          )}
          {backendStatus === 'error' && (
            <p className="text-sm text-red-600">❌ Backend not reachable - Please start the backend server</p>
          )}

          {user && (
            <p className="text-sm text-green-600 mt-2">
              Welcome, {user.email}! You can now generate AI tours.
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Selected Location */}
          {selectedLocation && (
            <div className="bg-white rounded-2xl border shadow-lg p-6">
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
            <div className="bg-white rounded-2xl border shadow-lg p-6">
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
            <div className="bg-white rounded-2xl border shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">📚 Your Tours</h2>
              <TourList refreshTrigger={tourRefreshTrigger} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}