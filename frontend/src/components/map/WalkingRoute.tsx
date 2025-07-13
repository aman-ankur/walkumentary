"use client";

import { Polyline } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { WalkableStop } from '@/lib/types';

interface LocationPoint {
  latitude?: number;
  longitude?: number;
}

interface WalkingRouteProps {
  mainLocation: LocationPoint;
  walkableStops: WalkableStop[];
  isActive?: boolean;
  activeStopIndex?: number;
}

export function WalkingRoute({ 
  mainLocation, 
  walkableStops, 
  isActive = false, 
  activeStopIndex 
}: WalkingRouteProps) {
  // Filter out stops without valid coordinates
  const validStops = walkableStops.filter(stop => 
    stop.latitude !== undefined && 
    stop.longitude !== undefined &&
    !isNaN(stop.latitude) && 
    !isNaN(stop.longitude)
  );

  // Return null if we don't have enough points for a route
  if (!mainLocation.latitude || !mainLocation.longitude || validStops.length === 0) {
    return null;
  }

  // Build route coordinates starting from main location
  const allPoints: LocationPoint[] = [mainLocation, ...validStops];
  const routeCoordinates: LatLngExpression[] = allPoints
    .filter(point => point.latitude !== undefined && point.longitude !== undefined)
    .map(point => [point.latitude!, point.longitude!]);

  // Return null if we don't have enough coordinates
  if (routeCoordinates.length < 2) {
    return null;
  }

  // Different styling based on active state
  const getRouteStyle = () => {
    if (isActive) {
      return {
        color: '#FF6B35',
        weight: 4,
        opacity: 0.8,
        dashArray: undefined, // Solid line when active
      };
    } else {
      return {
        color: '#FFA07A',
        weight: 3,
        opacity: 0.6,
        dashArray: '8, 6', // Dashed line when inactive
      };
    }
  };

  // Create segments if we want to highlight the active segment
  if (activeStopIndex !== undefined && activeStopIndex >= 0) {
    const segments = [];
    
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const isActiveSegment = i === activeStopIndex;
      const segmentCoordinates = [routeCoordinates[i], routeCoordinates[i + 1]];
      
      segments.push(
        <Polyline
          key={`segment-${i}`}
          positions={segmentCoordinates}
          pathOptions={{
            color: isActiveSegment ? '#FF4500' : '#FFA07A',
            weight: isActiveSegment ? 5 : 3,
            opacity: isActiveSegment ? 1.0 : 0.5,
            dashArray: isActiveSegment ? undefined : '5, 3',
          }}
        />
      );
    }
    
    return <>{segments}</>;
  }

  // Single polyline for the entire route
  return (
    <Polyline
      positions={routeCoordinates}
      pathOptions={getRouteStyle()}
    />
  );
}