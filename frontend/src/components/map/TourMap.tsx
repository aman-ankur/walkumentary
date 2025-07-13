"use client";

import { MapContainer } from './MapContainer';
import { LocationMarker } from './LocationMarker';
import { UserLocationMarker } from './UserLocationMarker';
import { POIMarker } from './POIMarker';
import { WalkableStopMarker } from './WalkableStopMarker';
import { WalkingRoute } from './WalkingRoute';
import { TourLocation, POILocation } from './types';
import { Tour, WalkableStop } from '@/lib/types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyLocations } from '@/hooks/useNearbyLocations';
import { useAudioPlayer } from '@/components/player/AudioPlayerProvider';
import { LatLngExpression } from 'leaflet';
import { useEffect, useState } from 'react';

interface TourMapProps {
  tour: Tour;
  className?: string;
  showUserLocation?: boolean;
  showNearbyPOIs?: boolean;
  showWalkableStops?: boolean;
  showWalkingRoute?: boolean;
  activeStopIndex?: number;
  onStopClick?: (stop: WalkableStop, index: number) => void;
}

export function TourMap({ 
  tour, 
  className = '', 
  showUserLocation = true, 
  showNearbyPOIs = false,
  showWalkableStops = true,
  showWalkingRoute = true,
  activeStopIndex,
  onStopClick
}: TourMapProps) {
  const { location: userLocation, isLoading: isLoadingLocation } = useGeolocation();
  const { isPlaying, currentTime } = useAudioPlayer();
  
  // Debug logging
  console.log('TourMap rendered with tour:', tour);
  console.log('Tour location coordinates:', tour.location?.latitude, tour.location?.longitude);
  
  // Fetch nearby POIs around the tour location
  const { 
    locations: nearbyLocations, 
    fetchNearbyLocations, 
    isLoading: isLoadingPOIs 
  } = useNearbyLocations({
    defaultRadius: 500,
    defaultFilters: {
      maxResults: 10,
      sortBy: 'distance'
    }
  });

  // Convert tour data to our map format
  const tourLocation: TourLocation = {
    id: 'tour-location',
    name: tour.location?.name || tour.title,
    title: tour.title,
    coordinates: {
      latitude: tour.location?.latitude || 0,
      longitude: tour.location?.longitude || 0,
    },
    description: tour.location?.description || tour.description,
    type: tour.location?.location_type || 'tour',
  };

  // Fetch nearby POIs when tour location is available
  useEffect(() => {
    if (showNearbyPOIs && tourLocation.coordinates) {
      try {
        fetchNearbyLocations([
          tourLocation.coordinates.latitude,
          tourLocation.coordinates.longitude
        ]);
      } catch (error) {
        console.warn('Failed to fetch nearby POIs:', error);
      }
    }
  }, [showNearbyPOIs, tourLocation.coordinates, fetchNearbyLocations]);

  // Convert nearby locations to POI format
  const poiLocations: POILocation[] = nearbyLocations
    .filter((loc) => loc.latitude != null && loc.longitude != null)
    .map((loc) => ({
      id: loc.id || `poi-${Math.random()}`,
      name: loc.name,
      coordinates: {
        latitude: loc.latitude!,
        longitude: loc.longitude!
      },
      description: loc.description,
      type: loc.location_type,
      category: loc.location_metadata?.category || loc.location_type || 'attraction',
      metadata: loc.location_metadata
    }));

  // Determine map center - prefer user location if available, fallback to tour location
  const mapCenter: LatLngExpression = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : [tourLocation.coordinates.latitude, tourLocation.coordinates.longitude];

  // Determine zoom level based on whether we have user location
  const mapZoom = userLocation ? 15 : 13;

  return (
    <div className={`w-full h-full ${className}`}>
      <MapContainer center={mapCenter} zoom={mapZoom}>
        {/* Tour location marker - always shown, highlight when playing */}
        <LocationMarker 
          location={tourLocation} 
          isActive={isPlaying}
          onClick={(location) => {
            console.log('Tour location clicked:', location);
          }}
        />

        {/* Nearby POI markers */}
        {showNearbyPOIs && poiLocations.map((poi) => (
          <POIMarker
            key={poi.id}
            location={poi}
            onClick={(location) => {
              console.log('POI clicked:', location);
            }}
          />
        ))}

        {/* Walking route visualization */}
        {showWalkingRoute && tour.walkable_stops && tour.walkable_stops.length > 0 && tour.location && (
          <WalkingRoute
            mainLocation={tour.location}
            walkableStops={tour.walkable_stops}
            isActive={isPlaying}
            activeStopIndex={activeStopIndex}
          />
        )}

        {/* Walkable stop markers */}
        {showWalkableStops && tour.walkable_stops && tour.walkable_stops.map((stop, index) => (
          <WalkableStopMarker
            key={`walkable-stop-${index}`}
            stop={stop}
            index={index + 1}
            isActive={activeStopIndex === index}
            onClick={() => {
              console.log('Walkable stop clicked:', stop);
              onStopClick?.(stop, index);
            }}
          />
        ))}

        {/* User location marker - show if location available and enabled */}
        {showUserLocation && userLocation && (
          <UserLocationMarker 
            coordinates={userLocation}
            accuracy={userLocation.accuracy}
            isTracking={!isLoadingLocation}
          />
        )}
      </MapContainer>

      {/* Loading indicator for GPS */}
      {showUserLocation && isLoadingLocation && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            Finding your location...
          </div>
        </div>
      )}

      {/* Tour information panel for walkable tours */}
      {tour.walkable_stops && tour.walkable_stops.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-orange-200">
          <div className="text-sm">
            <div className="font-semibold text-orange-800 mb-1">Walking Tour</div>
            <div className="text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-orange-600">•</span>
                <span>{tour.walkable_stops.length} stops</span>
              </div>
              {tour.total_walking_distance && (
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">🚶</span>
                  <span>{tour.total_walking_distance}</span>
                </div>
              )}
              {tour.estimated_walking_time && (
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">⏱️</span>
                  <span>{tour.estimated_walking_time}</span>
                </div>
              )}
              {tour.difficulty_level && (
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">📊</span>
                  <span className="capitalize">{tour.difficulty_level}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}