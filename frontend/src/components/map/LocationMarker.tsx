"use client";

import { Icon, LatLngExpression } from 'leaflet';
import { LocationMarkerProps } from './types';
import dynamic from 'next/dynamic';

// Dynamically import react-leaflet components
const DynamicMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const DynamicPopup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Create custom icon for tour locations
const createTourIcon = (isActive: boolean = false) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${isActive ? '#E87A47' : '#6B7280'}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
      <circle cx="12" cy="12" r="3" fill="${isActive ? '#E87A47' : '#6B7280'}"/>
    </svg>
  `)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

export function LocationMarker({ location, isActive = false, onClick }: LocationMarkerProps) {
  const position: LatLngExpression = [location.coordinates.latitude, location.coordinates.longitude];
  
  const handleClick = () => {
    if (onClick) {
      onClick(location);
    }
  };

  return (
    <DynamicMarker 
      position={position} 
      icon={createTourIcon(isActive)}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <DynamicPopup>
        <div className="min-w-[200px] p-2">
          <h3 className="font-semibold text-gray-900 mb-2">{location.name}</h3>
          {location.description && (
            <p className="text-gray-600 text-sm mb-2">{location.description}</p>
          )}
          {location.type && (
            <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              {location.type}
            </span>
          )}
        </div>
      </DynamicPopup>
    </DynamicMarker>
  );
}