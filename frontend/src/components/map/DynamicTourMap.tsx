"use client";

import dynamic from 'next/dynamic';
import { Tour } from '@/lib/types';

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
  tour: Tour;
  className?: string;
  showUserLocation?: boolean;
  showNearbyPOIs?: boolean;
  showWalkableStops?: boolean;
  showWalkingRoute?: boolean;
  activeStopIndex?: number;
}

export function DynamicTourMap(props: DynamicTourMapProps) {
  return <TourMapComponent {...props} />;
}