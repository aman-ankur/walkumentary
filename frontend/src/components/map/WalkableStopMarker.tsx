"use client";

import { Marker, Popup } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { WalkableStop } from '@/lib/types';

// Create custom icon for walkable stop markers
const createWalkableStopIcon = (index: number, isActive: boolean) => {
  const backgroundColor = isActive ? '#FF6B35' : '#FFA07A';
  const borderColor = isActive ? '#FF4500' : '#FF8C69';
  const textColor = '#FFFFFF';
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.2 0 0 7.2 0 16C0 28 16 40 16 40S32 28 32 16C32 7.2 24.8 0 16 0Z" fill="${backgroundColor}" stroke="${borderColor}" stroke-width="2"/>
        <circle cx="16" cy="16" r="10" fill="white"/>
        <text x="16" y="21" text-anchor="middle" fill="${backgroundColor}" font-size="12" font-weight="bold" font-family="Arial, sans-serif">${index}</text>
      </svg>
    `)}`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

interface WalkableStopMarkerProps {
  stop: WalkableStop;
  index: number;
  isActive?: boolean;
  onClick?: () => void;
}

export function WalkableStopMarker({ stop, index, isActive = false, onClick }: WalkableStopMarkerProps) {
  // Only render if we have valid coordinates
  if (!stop.latitude || !stop.longitude) {
    return null;
  }

  const position: LatLngExpression = [stop.latitude, stop.longitude];
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Marker
      position={position}
      icon={createWalkableStopIcon(index, isActive)}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div className="min-w-[220px] max-w-[300px] p-3">
          <h4 className="font-bold text-orange-600 mb-2 text-base">
            Stop {index}: {stop.name}
          </h4>
          
          {stop.description && (
            <p className="text-gray-700 text-sm mb-3 leading-relaxed">
              {stop.description}
            </p>
          )}
          
          {/* Timing Information */}
          <div className="text-xs text-gray-600 space-y-1 mb-3">
            {stop.content_duration && (
              <div className="flex items-center gap-1">
                <span className="font-semibold">Duration:</span>
                <span>{stop.content_duration}</span>
              </div>
            )}
            {stop.walking_time_from_previous && index > 1 && (
              <div className="flex items-center gap-1">
                <span className="font-semibold">Walk from previous:</span>
                <span>{stop.walking_time_from_previous}</span>
              </div>
            )}
            {stop.distance_from_main !== undefined && (
              <div className="flex items-center gap-1">
                <span className="font-semibold">Distance from start:</span>
                <span>{Math.round(stop.distance_from_main)}m</span>
              </div>
            )}
          </div>

          {/* Highlights */}
          {stop.highlights && stop.highlights.length > 0 && (
            <div className="border-t pt-2">
              <div className="text-xs font-semibold text-gray-700 mb-1">Highlights:</div>
              <ul className="text-xs text-gray-600 space-y-1">
                {stop.highlights.slice(0, 3).map((highlight, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span className="leading-tight">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Address information */}
          {stop.approximate_address && (
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
              <span className="font-semibold">Location:</span> {stop.approximate_address}
            </div>
          )}
          
          {/* Geocoding accuracy indicator */}
          {stop.geocoding_accuracy && (
            <div className="text-xs text-gray-400 mt-1">
              Location accuracy: {stop.geocoding_accuracy}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}