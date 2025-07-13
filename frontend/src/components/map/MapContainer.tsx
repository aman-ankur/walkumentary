"use client";

import { LatLngExpression } from 'leaflet';
import { MapContainerProps } from './types';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Default center (New York City)
const DEFAULT_CENTER: LatLngExpression = [40.7128, -74.0060];
const DEFAULT_ZOOM = 13;

interface ExtendedMapContainerProps extends MapContainerProps {
  style?: React.CSSProperties;
}

export function MapContainer({ 
  center = DEFAULT_CENTER, 
  zoom = DEFAULT_ZOOM, 
  className = '',
  style,
  children 
}: ExtendedMapContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`relative ${className} flex items-center justify-center bg-gray-100`} style={style}>
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  // Dynamic import with proper error handling
  const DynamicLeafletMap = dynamic(
    () => import('./SimpleLeafletMap'),
    { 
      ssr: false,
      loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
          <div className="text-gray-500">Loading map...</div>
        </div>
      )
    }
  );

  return (
    <div className={`relative ${className}`} style={style}>
      <DynamicLeafletMap center={center} zoom={zoom}>
        {children}
      </DynamicLeafletMap>
    </div>
  );
}