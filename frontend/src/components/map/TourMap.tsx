"use client";

import { MapContainer } from './MapContainer';
import { LocationMarker } from './LocationMarker';
import { UserLocationMarker } from './UserLocationMarker';
import { POIMarker } from './POIMarker';
import { TourLocation, POILocation } from './types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyLocations } from '@/hooks/useNearbyLocations';
import { useAudioPlayer } from '@/components/player/AudioPlayerProvider';
import { LatLngExpression } from 'leaflet';
import { useEffect } from 'react';

interface TourMapProps {
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

export function TourMap({ tour, className = '', showUserLocation = true, showNearbyPOIs = false }: TourMapProps) {
  const { location: userLocation, isLoading: isLoadingLocation } = useGeolocation();
  const { isPlaying, currentTime } = useAudioPlayer();
  
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
    name: tour.location.name,
    title: tour.title,
    coordinates: {
      latitude: tour.location.latitude,
      longitude: tour.location.longitude,
    },
    description: tour.location.description || tour.description,
    type: tour.location.location_type || 'tour',
  };

  // Fetch nearby POIs when tour location is available
  useEffect(() => {
    if (showNearbyPOIs && tourLocation.coordinates) {
      fetchNearbyLocations([
        tourLocation.coordinates.latitude,
        tourLocation.coordinates.longitude
      ]);
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
    </div>
  );
}