"use client";

import { Marker, Circle } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { UserLocationMarkerProps } from './types';

// Create custom icon for user location
const createUserIcon = (isTracking: boolean = false) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="3"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
      ${isTracking ? `
        <circle cx="12" cy="12" r="12" fill="none" stroke="#3B82F6" stroke-width="2" opacity="0.3">
          <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
    </svg>
  `)}`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

export function UserLocationMarker({ 
  coordinates, 
  accuracy = 10, 
  heading, 
  isTracking = false 
}: UserLocationMarkerProps) {
  const position: LatLngExpression = [coordinates.latitude, coordinates.longitude];
  
  return (
    <>
      {/* Accuracy circle */}
      <Circle
        center={position}
        radius={accuracy}
        pathOptions={{
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.1,
          weight: 2,
        }}
      />
      
      {/* User position marker */}
      <Marker 
        position={position} 
        icon={createUserIcon(isTracking)}
        zIndexOffset={1000} // Ensure user marker appears on top
      />
    </>
  );
}