import { LatLngExpression } from 'leaflet';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapLocation {
  id: string;
  name: string;
  coordinates: LocationCoordinates;
  description?: string;
  type?: string;
  imageUrl?: string;
}

export interface TourLocation extends MapLocation {
  title: string;
  content?: string;
  duration?: number;
}

export interface POILocation extends MapLocation {
  category?: string;
  metadata?: Record<string, any>;
}

export interface MapContainerProps {
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
}

export interface LocationMarkerProps {
  location: MapLocation;
  isActive?: boolean;
  onClick?: (location: MapLocation) => void;
}

export interface UserLocationMarkerProps {
  coordinates: LocationCoordinates;
  accuracy?: number;
  heading?: number;
  isTracking?: boolean;
}

export interface MapSyncState {
  userLocation: LocationCoordinates | null;
  tourLocation: TourLocation | null;
  nearbyPOIs: POILocation[];
  isTracking: boolean;
  accuracy?: number;
}