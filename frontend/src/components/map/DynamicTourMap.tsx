"use client";

import dynamic from 'next/dynamic';

// Create a wrapper that handles the dynamic import properly
const TourMapComponent = dynamic(
  () => import('./TourMap').then((mod) => ({ default: mod.TourMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }
);

interface DynamicTourMapProps {
  tour: {
    location: {
      name: string;
      latitude: number;
      longitude: number;
      description?: string;
      location_type?: string;
    };
    title: string;
    description?: string;
  };
  className?: string;
  showUserLocation?: boolean;
  showNearbyPOIs?: boolean;
}

export function DynamicTourMap(props: DynamicTourMapProps) {
  return <TourMapComponent {...props} />;
}