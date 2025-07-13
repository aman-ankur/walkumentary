"use client";

import { Marker, Popup } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { POILocation } from './types';

// Create custom icon for POI locations
const createPOIIcon = (category: string = 'default') => {
  const getColorByCategory = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'restaurant': return '#EF4444';
      case 'attraction': return '#8B5CF6';
      case 'museum': return '#10B981';
      case 'park': return '#22C55E';
      case 'shop': return '#F59E0B';
      case 'hotel': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const color = getColorByCategory(category);

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
        <circle cx="12" cy="12" r="2" fill="${color}"/>
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

interface POIMarkerProps {
  location: POILocation;
  onClick?: (location: POILocation) => void;
}

export function POIMarker({ location, onClick }: POIMarkerProps) {
  const position: LatLngExpression = [location.coordinates.latitude, location.coordinates.longitude];
  
  const handleClick = () => {
    if (onClick) {
      onClick(location);
    }
  };

  return (
    <Marker 
      position={position} 
      icon={createPOIIcon(location.category)}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <Popup>
        <div className="min-w-[180px] p-2">
          <h4 className="font-semibold text-gray-900 mb-1">{location.name}</h4>
          {location.description && (
            <p className="text-gray-600 text-sm mb-2">{location.description}</p>
          )}
          <div className="flex gap-2">
            {location.type && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {location.type}
              </span>
            )}
            {location.category && (
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {location.category}
              </span>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}